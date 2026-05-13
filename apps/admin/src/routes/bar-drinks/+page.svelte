<script lang="ts">
  import { enhance } from '$app/forms';
  import { getDrinks } from '$lib/remote/bar.remote';
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  const drinks = getDrinks();

  let saving = $state(false);
  let formError = $state('');
  let formSuccess = $state(false);

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-foreground">Bar Drinks</h1>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add Drink</h2>
    {#if formError}<Alert class="mb-3"><AlertDescription class="text-destructive">{formError}</AlertDescription></Alert>{/if}
    {#if formSuccess}<Alert class="mb-3"><AlertDescription class="text-green-500">Drink added successfully.</AlertDescription></Alert>{/if}
    <form
      method="POST"
      action="?/create"
      enctype="multipart/form-data"
      use:enhance={() => {
        saving = true; formError = ''; formSuccess = false;
        return async ({ result, update }) => {
          saving = false;
          if (result.type === 'success') { formSuccess = true; await update(); }
          else if (result.type === 'failure') { formError = (result.data as any)?.error || 'Failed'; }
        };
      }}
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="drinkName">Name</label>
        <input id="drinkName" name="drinkName" placeholder="e.g. Tusker Lager" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="drinkCode">Code</label>
        <input id="drinkCode" name="drinkCode" placeholder="e.g. TUS001" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="typeOfDrink">Type</label>
        <select id="typeOfDrink" name="typeOfDrink" required class={selectCls}>
          <option value="">Select type</option>
          {#each ['spirit','beer','rtd','wine','water'] as t}<option value={t}>{t}</option>{/each}
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="uom">Unit of Measure</label>
        <select id="uom" name="uom" required class={selectCls}>
          <option value="">Select UOM</option>
          {#each ['bottles','crates','pack'] as u}<option value={u}>{u}</option>{/each}
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="packageQty">Package Qty</label>
        <input id="packageQty" name="packageQty" type="number" min="1" placeholder="24" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="buyingPrice">Buying Price (KES)</label>
        <input id="buyingPrice" name="buyingPrice" type="number" min="0" step="0.01" placeholder="0.00" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="sellingPrice">Selling Price (KES)</label>
        <input id="sellingPrice" name="sellingPrice" type="number" min="0" step="0.01" placeholder="0.00" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
        <label class="text-xs text-muted-foreground" for="file">Image</label>
        <input id="file" name="file" type="file" accept="image/*" required
          class="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-secondary file:text-foreground" />
      </div>
      <div class="flex items-end">
        <Button type="submit" class="w-full" disabled={saving}>{saving ? 'Saving…' : 'Add Drink'}</Button>
      </div>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await drinks}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Code','Name','Type','UOM','Stock','Selling Price','In Stock'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as d}
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
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
