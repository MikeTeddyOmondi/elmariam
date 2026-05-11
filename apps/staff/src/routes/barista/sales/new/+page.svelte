<script lang="ts">
  import { checkoutBarSale, getDrinks } from '$lib/remote/bar.remote';

  const drinks = getDrinks();

  type LineItem = { drinkId: string; quantity: number };
  let items = $state<LineItem[]>([{ drinkId: '', quantity: 1 }]);
  let error = $state('');
  let success = $state('');

  function addItem() {
    items = [...items, { drinkId: '', quantity: 1 }];
  }

  function removeItem(i: number) {
    items = items.filter((_, idx) => idx !== i);
  }

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
</script>

<a href="/barista/sales" class="back">← Back</a>
<h1>New Sale</h1>

{#if success}<p class="success">{success}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={submit} class="form">
  {#await drinks then drinkList}
    {#each items as item, i}
      <div class="line">
        <select bind:value={item.drinkId} required>
          <option value="">Select drink</option>
          {#each drinkList as d}
            <option value={d._id}>{d.drinkName} ({d.drinkCode}) — stock: {d.stockQty}</option>
          {/each}
        </select>
        <input type="number" bind:value={item.quantity} min="1" placeholder="Qty" required />
        <button type="button" onclick={() => removeItem(i)} class="remove">✕</button>
      </div>
    {/each}
  {/await}
  <button type="button" onclick={addItem} class="add">+ Add Item</button>
  <button type="submit">Checkout</button>
</form>

<style>
  .back { color: #2c3e50; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 560px; display: flex; flex-direction: column; gap: 1rem; }
  .line { display: flex; gap: 0.5rem; align-items: center; }
  .line select { flex: 1; }
  .line input { width: 80px; }
  select, input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  .remove { background: #c0392b; color: #fff; border: none; padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer; }
  .add { background: #7f8c8d; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
  button[type="submit"] { background: #2c3e50; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .success { color: #27ae60; }
  .error { color: red; }
</style>
