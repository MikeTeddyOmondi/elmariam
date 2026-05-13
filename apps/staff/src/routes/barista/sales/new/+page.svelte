<script lang="ts">
  import { checkoutBarSale, getDrinks } from '$lib/remote/bar.remote';
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  const drinks = getDrinks();

  type LineItem = { drinkId: string; quantity: number };
  let items = $state<LineItem[]>([{ drinkId: '', quantity: 1 }]);
  let error = $state('');
  let success = $state('');

  function addItem() { items = [...items, { drinkId: '', quantity: 1 }]; }
  function removeItem(i: number) { items = items.filter((_, idx) => idx !== i); }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    const valid = items.filter((it) => it.drinkId && it.quantity > 0);
    if (!valid.length) { error = 'Add at least one item.'; return; }
    try {
      await checkoutBarSale({ checkoutDrinkItems: valid });
      success = 'Sale recorded.';
      items = [{ drinkId: '', quantity: 1 }];
    } catch (err: any) {
      error = err.message;
    }
  }

  const selectCls = 'flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const inputCls = 'w-20 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring';
</script>

<div class="space-y-6 max-w-xl">
  <div>
    <a href="/barista/sales" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">New Sale</h1>
  </div>

  {#if success}
    <Alert><AlertDescription class="text-green-400">{success}</AlertDescription></Alert>
  {/if}
  {#if error}
    <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
  {/if}

  <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
    {#await drinks then drinkList}
      {#each items as item, i}
        <div class="flex gap-2 items-center">
          <select bind:value={item.drinkId} required class={selectCls}>
            <option value="">Select drink</option>
            {#each drinkList as d}
              <option value={d._id}>{d.drinkName} ({d.drinkCode}) — stock: {d.stockQty}</option>
            {/each}
          </select>
          <input type="number" bind:value={item.quantity} min="1" placeholder="Qty" required class={inputCls} />
          <button type="button" onclick={() => removeItem(i)}
            class="px-2 py-2 rounded-md text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">✕</button>
        </div>
      {/each}
    {/await}
    <button type="button" onclick={addItem}
      class="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 transition-colors">
      + Add Item
    </button>
    <Button type="submit" class="w-full">Checkout</Button>
  </form>
</div>
