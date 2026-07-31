import { toast } from "svelte-sonner";

export { default as Toaster } from "./sonner.svelte";
export { toast };

/**
 * Turns a thrown error into a user-facing toast.
 *
 * Call sites used to do `toast.error(err.message || 'An error occurred')`,
 * which rendered the generic fallback for every SvelteKit `error()` — including
 * the 403s that the RBAC guards now raise routinely for read-only roles.
 */
export function toastError(err: unknown, fallback = "Something went wrong."): void {
  toast.error(messageFor(err, fallback));
}

/** The message `toastError` would show. Exported for inline error rendering. */
export function messageFor(err: unknown, fallback = "Something went wrong."): string {
  const status = statusOf(err);

  // Status wins over the server's text: these three are actionable in a way
  // the raw message usually is not.
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That item could not be found.";

  const body = bodyMessageOf(err);
  if (body) return body;

  if (status && status >= 500) return "The server had a problem. Please try again.";

  return fallback;
}

function statusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/**
 * SvelteKit's `error(status, message)` surfaces as `{ status, body: { message } }`
 * on the client, not as `err.message` — which is why the old call sites always
 * fell through to their generic fallback.
 */
function bodyMessageOf(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;

  const body = (err as { body?: unknown }).body;
  if (typeof body === "object" && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  const message = (err as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;

  return undefined;
}
