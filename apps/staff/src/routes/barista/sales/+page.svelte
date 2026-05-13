<script lang="ts">
  import { getBarSales } from '$lib/remote/bar.remote';
  import { Alert, AlertDescription } from '@elmariam/ui';

  const sales = getBarSales();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Sales</h1>
      <p class="text-sm text-muted-foreground mt-1">Bar sales transactions</p>
    </div>
    <a href="/barista/sales/new"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      + New Sale
    </a>
  </div>

  {#await sales}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:then data}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Sale ID','Items','Total Stock Value'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as sale}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{sale._id}</td>
              <td class="px-4 py-3 text-muted-foreground">{sale.drinks?.length ?? 0} item(s)</td>
              <td class="px-4 py-3 text-foreground font-medium">KES {sale.totalStockValue?.toLocaleString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:catch err}
    <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
  {/await}
</div>
