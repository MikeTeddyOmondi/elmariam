<script lang="ts">
  import { createBarPurchase, getDrinks } from '$lib/remote/bar.remote';

  const drinks = getDrinks();

  let receiptNumber = $state('');
  let product = $state('');
  let quantity = $state(1);
  let supplier = $state('');
  let error = $state('');
  let success = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    try {
      await createBarPurchase({ receiptNumber, product, quantity, supplier });
      success = 'Purchase recorded.';
      receiptNumber = product = supplier = '';
      quantity = 1;
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<a href="/barista/purchases" class="back">← Back</a>
<h1>New Purchase</h1>

{#if success}<p class="success">{success}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={submit} class="form">
  <label>Receipt # <input bind:value={receiptNumber} required /></label>
  <label>
    Product
    {#await drinks}
      <select disabled><option>Loading…</option></select>
    {:then data}
      <select bind:value={product} required>
        <option value="">Select drink</option>
        {#each data as d}
          <option value={d._id}>{d.drinkName} ({d.drinkCode})</option>
        {/each}
      </select>
    {/await}
  </label>
  <label>Quantity <input type="number" bind:value={quantity} min="1" required /></label>
  <label>Supplier <input bind:value={supplier} required /></label>
  <button type="submit">Record Purchase</button>
</form>

<style>
  .back { color: #2c3e50; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 480px; display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: #555; }
  input, select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  button { background: #2c3e50; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .success { color: #27ae60; }
  .error { color: red; }
</style>
