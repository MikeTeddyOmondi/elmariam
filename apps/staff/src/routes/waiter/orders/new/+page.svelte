<script lang="ts">
  import { createOrder, getMenuItems } from '$lib/remote/restaurant.remote';

  const menuItems = getMenuItems();

  type LineItem = { menuItemId: string; quantity: number };
  let items = $state<LineItem[]>([{ menuItemId: '', quantity: 1 }]);
  let tableNumber = $state<number | undefined>(undefined);
  let paymentMethod = $state<'cash' | 'mpesa' | 'bank'>('cash');
  let error = $state('');
  let success = $state('');

  function addItem() {
    items = [...items, { menuItemId: '', quantity: 1 }];
  }

  function removeItem(i: number) {
    items = items.filter((_, idx) => idx !== i);
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    const valid = items.filter((it) => it.menuItemId && it.quantity > 0);
    if (!valid.length) { error = 'Add at least one item.'; return; }
    try {
      await createOrder({ items: valid, tableNumber, paymentMethod });
      success = 'Order created.';
      items = [{ menuItemId: '', quantity: 1 }];
      tableNumber = undefined;
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<a href="/waiter/orders" class="back">← Back</a>
<h1>New Order</h1>

{#if success}<p class="success">{success}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={submit} class="form">
  <label>Table # (optional) <input type="number" bind:value={tableNumber} min="1" /></label>

  {#await menuItems then menu}
    {#each items as item, i}
      <div class="line">
        <select bind:value={item.menuItemId} required>
          <option value="">Select item</option>
          {#each menu.filter((m: any) => m.isAvailable) as m}
            <option value={m._id}>{m.name} — KES {m.price?.toLocaleString()}</option>
          {/each}
        </select>
        <input type="number" bind:value={item.quantity} min="1" placeholder="Qty" required />
        <button type="button" onclick={() => removeItem(i)} class="remove">✕</button>
      </div>
    {/each}
  {/await}

  <button type="button" onclick={addItem} class="add">+ Add Item</button>

  <label>
    Payment Method
    <select bind:value={paymentMethod}>
      <option value="cash">Cash</option>
      <option value="mpesa">M-Pesa</option>
      <option value="bank">Bank</option>
    </select>
  </label>

  <button type="submit">Place Order</button>
</form>

<style>
  .back { color: #1a5276; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 560px; display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: #555; }
  .line { display: flex; gap: 0.5rem; align-items: center; }
  .line select { flex: 1; }
  .line input { width: 80px; }
  select, input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  .remove { background: #c0392b; color: #fff; border: none; padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer; }
  .add { background: #7f8c8d; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; align-self: flex-start; }
  button[type="submit"] { background: #1a5276; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .success { color: #27ae60; }
  .error { color: red; }
</style>
