<script lang="ts">
  import { getDrinks } from '$lib/remote/bar.remote';
  import { Alert, AlertDescription, messageFor } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getDrinks>>[number];

  let drinks = $state<Row[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d as Row[]; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Drinks</h1>
    <!-- Read-only for baristas: new drinks are added in the admin app. Stock
         moves through purchases and sales, not through the catalogue. -->
    <p class="mt-1 text-sm text-muted-foreground">Bar inventory catalog</p>
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:else if loadError}
    <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
  {:else}
      {@const data = drinks}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Code','Name','Type','UOM','Pkg Qty','Stock Qty','Selling Price','In Stock'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as drink}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{drink.drinkCode}</td>
              <td class="px-4 py-3 text-foreground font-medium">{drink.drinkName}</td>
              <td class="px-4 py-3 text-muted-foreground">{drink.typeOfDrink}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{drink.uom}</td>
              <td class="px-4 py-3 text-muted-foreground">{drink.packageQty}</td>
              <td class="px-4 py-3 text-muted-foreground">{drink.stockQty}</td>
              <td class="px-4 py-3 text-muted-foreground">KES {drink.sellingPrice?.toLocaleString()}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                  {drink.inStock ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}">
                  {drink.inStock ? 'Yes' : 'No'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
