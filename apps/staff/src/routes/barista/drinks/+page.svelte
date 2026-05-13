<script lang="ts">
  import { getDrinks } from '$lib/remote/bar.remote';
  import { Alert, AlertDescription } from '@elmariam/ui';

  const drinks = getDrinks();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Drinks</h1>
      <p class="text-sm text-muted-foreground mt-1">Bar inventory catalog</p>
    </div>
    <a href="/barista/drinks/new"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      + Add Drink
    </a>
  </div>

  {#await drinks}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:then data}
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
  {:catch err}
    <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
  {/await}
</div>
