<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getInvoices } from '$lib/remote/hotel.remote';
  import { toastError } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getInvoices>>[number];

  let invoices = $state<Row[]>([]);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getInvoices()
      .then((d) => { invoices = d as Row[]; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });
  const statusClass: Record<string, string> = {
    paid:    'bg-green-400/10 text-green-400',
    pending: 'bg-yellow-400/10 text-yellow-400',
    overdue: 'bg-red-400/10 text-red-400',
  };
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Invoices</h1>
    <p class="text-sm text-muted-foreground mt-1">Billing and payment records</p>
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
{:else}
      {@const data = invoices.slice((__page - 1) * __perPage, __page * __perPage)}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Booking Ref','Status','Payment','Sub Total','VAT','Total (KES)'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as inv}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-mono text-xs">{inv.bookingRef}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {statusClass[inv.status] ?? 'bg-secondary text-muted-foreground'}">
                  {inv.status}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{inv.paymentMethod}</td>
              <td class="px-4 py-3 text-muted-foreground">{inv.subTotalCost?.toLocaleString()}</td>
              <td class="px-4 py-3 text-muted-foreground">{inv.vat?.toLocaleString()}</td>
              <td class="px-4 py-3 text-foreground font-medium">{inv.totalCost?.toLocaleString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={invoices.length} perPage={__perPage} label="invoices" />
      </div>
    </div>
  {/if}
</div>
