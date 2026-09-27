<script lang="ts">
  import Dialog from "../dialog/dialog.svelte";
  import Receipt, { type ReceiptData } from "./receipt.svelte";
  import { Button } from "../button/index.js";
  import Printer from "lucide-svelte/icons/printer";

  interface Props {
    open?: boolean;
    data: ReceiptData | null;
    title?: string;
    onclose?: () => void;
  }
  let { open = false, data, title = "Receipt", onclose }: Props = $props();

  function print() {
    // The global `@media print` rule in app.css isolates `[data-receipt]`, so
    // this prints only the receipt paper, not the surrounding app or dialog.
    window.print();
  }
</script>

{#if data}
  <Dialog
    {open}
    {title}
    description="Preview the receipt, then print it to the thermal printer."
    {onclose}
  >
    <!--
      Preview copy: `printable={false}` so it carries no `data-receipt`. It lives
      inside the dialog's scroll box and transformed content, which would clip it
      when printing, so it is screen-only.
    -->
    <div class="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-neutral-100 p-4">
      <Receipt {data} printable={false} />
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="outline" onclick={() => onclose?.()}>Close</Button>
      <Button onclick={print}>
        <Printer />
        Print
      </Button>
    </div>
  </Dialog>

  <!--
    Print copy: rendered at the page root (not inside the portalled/transformed
    dialog), hidden on screen and shown only when printing. This is the copy the
    `[data-receipt]` print rule lifts to the page, so the whole receipt prints.
  -->
  <div class="hidden print:block" aria-hidden="true">
    <Receipt {data} />
  </div>
{/if}
