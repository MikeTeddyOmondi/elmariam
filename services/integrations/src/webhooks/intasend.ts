import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db";
import { env } from "../config/env";

// Must match the api_ref the admin and staff apps put on the STK push.
const BOOKING_REF_PREFIX = "hotel-elmariam-booking-";

/** What IntaSend sends. Only the fields that decide anything are named. */
interface IntaSendWebhook {
  invoice_id?: string;
  id?: string;
  state?: string;
  value?: string | number;
  api_ref?: string;
  challenge?: string;
  failed_reason?: string | null;
}

// Hashing first gives both sides the same length, which timingSafeEqual
// requires, and keeps the comparison constant-time for any input.
function sameSecret(presented: string, expected: string) {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

const ack = (res: Response, status: string) => res.status(200).json({ status });

/**
 * POST /webhooks/intasend
 *
 * Unauthenticated by necessity (IntaSend carries no token of ours), so it is
 * verified by the shared challenge string set on the webhook in the IntaSend
 * dashboard. Without that check anyone who can reach this route could mark any
 * booking paid by posting a JSON body.
 *
 * Which booking, and how much it costs, always come from our own records. The
 * body is attacker-shaped input even after the challenge passes.
 */
export async function intasendWebhook(req: Request, res: Response) {
  const body = (req.body ?? {}) as IntaSendWebhook;

  const expected = env.INTASEND_WEBHOOK_CHALLENGE;
  if (!expected) {
    console.error("[webhook] INTASEND_WEBHOOK_CHALLENGE is unset, refusing to trust the call");
    return res.status(503).json({ error: "Webhook verification is not configured" });
  }
  if (!sameSecret(String(body.challenge ?? ""), expected)) {
    console.warn("[webhook] rejected a delivery with a bad challenge");
    return res.status(401).json({ error: "Bad challenge" });
  }

  const invoiceId = body.invoice_id ?? body.id;
  const state = String(body.state ?? "").toUpperCase();
  const apiRef = String(body.api_ref ?? "");

  // Every non-2xx makes IntaSend retry, so anything we cannot act on is
  // acknowledged with 200 and logged instead.
  if (!apiRef.startsWith(BOOKING_REF_PREFIX)) {
    console.warn(`[webhook] invoice ${invoiceId}: unrecognised api_ref "${apiRef}"`);
    return ack(res, "unknown reference");
  }

  const bookingId = apiRef.slice(BOOKING_REF_PREFIX.length);
  if (!ObjectId.isValid(bookingId)) {
    console.warn(`[webhook] invoice ${invoiceId}: malformed booking id in "${apiRef}"`);
    return ack(res, "unknown reference");
  }

  // PENDING and PROCESSING are progress reports; only the final states matter.
  if (state === "FAILED" || state === "CANCELLED") {
    console.warn(
      `[webhook] booking ${bookingId}: IntaSend reported ${state}` +
        (body.failed_reason ? ` (${body.failed_reason})` : "")
    );
    return ack(res, "recorded failure");
  }
  if (state !== "COMPLETE" && state !== "COMPLETED") {
    return ack(res, "ignored state");
  }

  try {
    const db = getDb();
    const booking = await db
      .collection<{ invoiceRef?: ObjectId }>("bookings")
      .findOne({ _id: new ObjectId(bookingId) }, { projection: { invoiceRef: 1 } });
    if (!booking?.invoiceRef) {
      console.warn(`[webhook] invoice ${invoiceId}: no booking or invoice for ${bookingId}`);
      return ack(res, "unknown booking");
    }

    const invoices = db.collection<{ totalCost: number; status: string }>("invoices");
    const invoice = await invoices.findOne(
      { _id: booking.invoiceRef },
      { projection: { totalCost: 1, status: 1 } }
    );
    if (!invoice) {
      console.warn(`[webhook] invoice ${invoiceId}: booking ${bookingId} points at a missing invoice`);
      return ack(res, "unknown booking");
    }

    // An underpayment is real money but not the bill: leave it pending for a
    // human rather than settling the booking.
    const paid = Number(body.value);
    if (!Number.isFinite(paid) || paid < invoice.totalCost) {
      console.error(
        `[webhook] booking ${bookingId}: paid ${body.value} against a total of ${invoice.totalCost}, not settling`
      );
      return ack(res, "amount mismatch");
    }

    // Conditional on "pending" so a redelivery cannot apply twice.
    const updated = await invoices.updateOne(
      { _id: booking.invoiceRef, status: "pending" },
      { $set: { status: "paid", paymentMethod: "mpesa", updatedAt: new Date() } }
    );
    if (updated.modifiedCount === 0) {
      console.log(`[webhook] booking ${bookingId}: already paid, acknowledging`);
      return ack(res, "already applied");
    }

    console.log(`✅  booking ${bookingId} paid via IntaSend invoice ${invoiceId}`);
    return ack(res, "applied");
  } catch (e) {
    // 500 on purpose: a database fault is transient, and the retry is wanted.
    console.error(`[webhook] booking ${bookingId}: could not record the payment:`, e);
    return res.status(500).json({ error: "Could not record the payment" });
  }
}
