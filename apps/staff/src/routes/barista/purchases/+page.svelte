<script lang="ts">
  import { getBarPurchases } from '$lib/remote/bar.remote';
  import { Alert, AlertDescription } from '@elmariam/ui';

  const purchases = getBarPurchases();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Purchases</h1>
      <p class="text-sm text-muted-foreground mt-1">Stock purchase records</p>
    </div>
    <a href="/barista/purchases/new"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      + New Purchase
    </a>
  </div>

  {#await purchases}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:then data}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Receipt #','Product','Quantity','Supplier','Stock Value'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as p}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{p.receiptNumber}</td>
              <td class="px-4 py-3 text-foreground">{p.product?.drinkName ?? p.product}</td>
              <td class="px-4 py-3 text-muted-foreground">{p.quantity}</td>
              <td class="px-4 py-3 text-muted-foreground">{p.supplier}</td>
              <td class="px-4 py-3 text-muted-foreground">KES {p.stockValue?.toLocaleString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:catch err}
    <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
  {/await}
</div>
