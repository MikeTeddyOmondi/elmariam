<script lang="ts">
  import Dialog from "../dialog/dialog.svelte";
  import { Button } from "../button/index.js";
  import { Input } from "../input/index.js";
  import { Label } from "../label/index.js";
  import { Textarea } from "../textarea/index.js";
  import { toast } from "../sonner/index.js";
  import { toastError } from "../sonner/index.js";
  import Smartphone from "lucide-svelte/icons/smartphone";
  import MessageSquare from "lucide-svelte/icons/message-square";

  interface Props {
    /** Amount to charge via M-Pesa (the sale total). */
    amount: number;
    /** A stable reference for the transaction (e.g. the sale id). */
    reference: string;
    /** Pre-filled SMS body; editable in the dialog. */
    smsMessage?: string;
    /** Charge callback. Should throw on failure. */
    onMpesa: (phone: string) => Promise<unknown>;
    /** SMS callback. Should throw on failure. */
    onSms: (phone: string, message: string) => Promise<unknown>;
    /** Compact buttons for dense table rows. */
    compact?: boolean;
  }
  let { amount, reference, smsMessage = "", onMpesa, onSms, compact = false }: Props = $props();

  let mode = $state<null | "mpesa" | "sms">(null);
  let phone = $state("");
  let message = $state("");
  let pending = $state(false);

  const currency = "KES";
  const fmt = (n: number) => `${currency} ${Number(n ?? 0).toLocaleString()}`;

  function open(next: "mpesa" | "sms") {
    phone = "";
    message = smsMessage;
    mode = next;
  }

  async function submit() {
    if (!phone.trim()) {
      toast.error("Enter a phone number.");
      return;
    }
    pending = true;
    try {
      if (mode === "mpesa") {
        await onMpesa(phone.trim());
        toast.success("M-Pesa STK push initiated.");
      } else {
        await onSms(phone.trim(), message);
        toast.success("SMS sent.");
      }
      mode = null;
    } catch (e) {
      toastError(e);
    } finally {
      pending = false;
    }
  }

  const btnClass = $derived(compact ? "h-7 px-2 text-xs" : "");
</script>

<div class="inline-flex items-center gap-1">
  <Button variant="outline" class={btnClass} onclick={() => open("mpesa")}>
    <Smartphone class={compact ? "size-3" : "size-4"} />
    M-Pesa
  </Button>
  <Button variant="outline" class={btnClass} onclick={() => open("sms")}>
    <MessageSquare class={compact ? "size-3" : "size-4"} />
    SMS
  </Button>
</div>

<Dialog
  open={mode !== null}
  title={mode === "mpesa" ? "Charge via M-Pesa" : "Send SMS"}
  description={mode === "mpesa"
    ? `Send an STK push for ${fmt(amount)} to the customer's phone.`
    : "Send an SMS to the customer's phone."}
  pending={pending}
  onclose={() => (mode = null)}
>
  <div class="grid gap-4">
    <div class="grid gap-2">
      <Label for="pay-phone-{reference}">Phone number</Label>
      <Input
        id="pay-phone-{reference}"
        type="tel"
        placeholder="+254700000000"
        bind:value={phone}
      />
    </div>

    {#if mode === "sms"}
      <div class="grid gap-2">
        <Label for="pay-msg-{reference}">Message</Label>
        <Textarea id="pay-msg-{reference}" rows={3} bind:value={message} />
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={pending} onclick={() => (mode = null)}>
        Cancel
      </Button>
      <Button type="button" disabled={pending} onclick={submit}>
        {#if mode === "mpesa"}
          <Smartphone class="size-4" />
          {pending ? "Sending…" : "Send STK push"}
        {:else}
          <MessageSquare class="size-4" />
          {pending ? "Sending…" : "Send SMS"}
        {/if}
      </Button>
    </div>
  </div>
</Dialog>
