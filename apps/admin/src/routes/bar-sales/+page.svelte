<script lang="ts">
  import { getBarSales } from '$lib/remote/bar.remote';

  let sales: any[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => {
    getBarSales()
      .then(d => { sales = d; loading = false; })
      .catch(e => { loadError = e.message; loading = false; });
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bar Sales</h1>
    <p class="text-sm text-muted-foreground mt-1">All recorded bar transactions</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if loading}
      <div class="divide-y divide-border">
        <div class="h-10 bg-secondary/50 animate-pulse rounded"></div>
        {#each Array(5) as _}
          <div class="flex gap-4 px-4 py-3">
            <div class="h-4 w-32 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-24 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Sale ID','Items','Total Stock Value'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each sales as sale}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{sale.id}</td>
              <td class="px-4 py-3 text-foreground">{sale.drinks?.length ?? 0} item(s)</td>
              <td class="px-4 py-3 text-foreground font-medium">KES {sale.totalStockValue?.toLocaleString() ?? '—'}</td>
            </tr>
          {:else}
            <tr><td colspan="3" class="px-4 py-6 text-center text-sm text-muted-foreground">No sales found</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
