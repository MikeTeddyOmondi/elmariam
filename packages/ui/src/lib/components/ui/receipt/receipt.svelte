<script lang="ts" module>
  export interface ReceiptItem {
    name: string;
    qty: number;
    amount: number;
  }
  export interface ReceiptMeta {
    label: string;
    value: string;
  }
  export interface ReceiptTotal {
    label: string;
    amount: number;
    strong?: boolean;
  }
  export interface ReceiptData {
    business?: string;
    subtitle?: string;
    reference: string;
    date?: Date;
    meta?: ReceiptMeta[];
    items?: ReceiptItem[];
    totals?: ReceiptTotal[];
    footer?: string;
    currency?: string;
  }
</script>

<script lang="ts">
  interface Props {
    data: ReceiptData;
    /**
     * Tags this instance with `data-receipt`, the hook the print stylesheet
     * isolates. The on-screen preview inside a dialog sets this false so only
     * the dedicated (unclipped) print copy is sent to the printer.
     */
    printable?: boolean;
  }
  let { data, printable = true }: Props = $props();

  const currency = $derived(data.currency ?? 'KES');
  const date = $derived(data.date ?? new Date());
  const fmt = (n: number) => `${currency} ${Number(n ?? 0).toLocaleString()}`;
</script>

<!--
  Always white paper with black ink and inline styles in millimetres, so the
  output is identical in light or dark mode and lands correctly on an 80mm
  thermal roll. `data-receipt` is the hook the global print stylesheet uses to
  isolate this element when the page is printed.
-->
<div
  data-receipt={printable ? '' : undefined}
  class="mx-auto bg-white text-black"
  style="width: 80mm; padding: 5mm 4mm; font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 11px; line-height: 1.3;"
>
  <div style="text-align: center;">
    <div style="font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
      {data.business ?? "El'Mariam Hotel"}
    </div>
    {#if data.subtitle}
      <div style="margin-top: 2px;">{data.subtitle}</div>
    {/if}
  </div>

  <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

  <div style="display: flex; justify-content: space-between;">
    <span>Ref</span><span>{data.reference}</span>
  </div>
  <div style="display: flex; justify-content: space-between;">
    <span>Date</span><span>{date.toLocaleString()}</span>
  </div>
  {#each data.meta ?? [] as m}
    <div style="display: flex; justify-content: space-between; gap: 8px;">
      <span>{m.label}</span><span style="text-align: right;">{m.value}</span>
    </div>
  {/each}

  {#if (data.items ?? []).length}
    <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
    {#each data.items ?? [] as it}
      <div style="display: flex; justify-content: space-between; gap: 8px;">
        <span>{it.qty} &times; {it.name}</span>
        <span style="text-align: right;">{fmt(it.amount)}</span>
      </div>
    {/each}
  {/if}

  {#if (data.totals ?? []).length}
    <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
    {#each data.totals ?? [] as t}
      <div style="display: flex; justify-content: space-between; font-weight: {t.strong ? 700 : 400};">
        <span>{t.label}</span><span>{fmt(t.amount)}</span>
      </div>
    {/each}
  {/if}

  <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
  <div style="text-align: center;">{data.footer ?? 'Thank you!'}</div>
</div>
