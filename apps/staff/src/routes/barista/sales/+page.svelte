<script lang="ts">
  import { getBarSales } from '$lib/remote/bar.remote';
  import { Alert, AlertDescription, messageFor } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getBarSales>>[number];

  let sales = $state<Row[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getBarSales()
      .then((d) => { sales = d as Row[]; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
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

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:else if loadError}
    <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
  {:else}
      {@const data = sales}
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
  {/if}
</div>
