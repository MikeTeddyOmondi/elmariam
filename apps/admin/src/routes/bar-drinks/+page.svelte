<script lang="ts">
  import { getDrinks, createDrink, type DrinkView } from '$lib/remote/bar.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let drinks: DrinkView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => {
    getDrinks()
      .then(d => { drinks = d; loading = false; })
      .catch(e => { loadError = e.message; loading = false; });
  });

  let drinkName         = $state('');
  let drinkCode         = $state('');
  let typeOfDrink       = $state<'spirit'|'beer'|'rtd'|'wine'|'water'>('beer');
  let uom               = $state<'bottles'|'crates'|'pack'>('bottles');
  let packageQty        = $state(24);
  let buyingStockPrice  = $state(0);
  let sellingStockPrice = $state(0);
  let saving            = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    try {
      await createDrink({ drinkName, drinkCode, typeOfDrink, uom, packageQty, buyingStockPrice, sellingStockPrice });
      toast.success('Drink added successfully.');
      drinkName = ''; drinkCode = ''; packageQty = 24; buyingStockPrice = 0; sellingStockPrice = 0;
      getDrinks().then(d => { drinks = d; }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-foreground">Bar Drinks</h1>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add Drink</h2>
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="drinkName">Name</label>
        <input id="drinkName" bind:value={drinkName} placeholder="e.g. Tusker Lager" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="drinkCode">Code</label>
        <input id="drinkCode" bind:value={drinkCode} placeholder="e.g. TUS001" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="typeOfDrink">Type</label>
        <select id="typeOfDrink" bind:value={typeOfDrink} required class={selectCls}>
          {#each ['spirit','beer','rtd','wine','water'] as t}<option value={t}>{t}</option>{/each}
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="uom">Unit of Measure</label>
        <select id="uom" bind:value={uom} required class={selectCls}>
          {#each ['bottles','crates','pack'] as u}<option value={u}>{u}</option>{/each}
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="packageQty">Package Qty</label>
        <input id="packageQty" bind:value={packageQty} type="number" min="1" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="buyingPrice">Buying Price (KES)</label>
        <input id="buyingPrice" bind:value={buyingStockPrice} type="number" min="0" step="0.01" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="sellingPrice">Selling Price (KES)</label>
        <input id="sellingPrice" bind:value={sellingStockPrice} type="number" min="0" step="0.01" required class={inputCls} />
      </div>
      <div class="sm:col-span-2 flex items-end">
        <Button type="submit" class="w-full" disabled={saving}>{saving ? 'Saving…' : 'Add Drink'}</Button>
      </div>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if loading}
      <div class="divide-y divide-border">
        <div class="h-10 bg-secondary/50 animate-pulse rounded"></div>
        {#each Array(5) as _}
          <div class="flex gap-3 px-4 py-3">
            <div class="h-4 w-20 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-16 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-16 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-12 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-20 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-12 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Code','Name','Type','UOM','Stock','Selling Price','In Stock'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each drinks as d}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{d.drinkCode}</td>
              <td class="px-4 py-3 text-foreground font-medium">{d.drinkName}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{d.typeOfDrink}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{d.uom}</td>
              <td class="px-4 py-3 text-foreground">{d.stockQty ?? 0}</td>
              <td class="px-4 py-3 text-foreground">KES {d.sellingPrice?.toLocaleString()}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  {d.inStock ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}">
                  {d.inStock ? 'Yes' : 'No'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
