<script lang="ts">
  const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8009';

  let drinkName = $state('');
  let drinkCode = $state('');
  let typeOfDrink = $state('');
  let uom = $state('bottles');
  let packageQty = $state(1);
  let buyingPrice = $state(0);
  let sellingPrice = $state(0);
  let file = $state<File | null>(null);
  let error = $state('');
  let success = $state('');

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    file = input.files?.[0] ?? null;
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    const token = document.cookie.split('; ').find((c) => c.startsWith('auth_token='))?.split('=')[1];
    if (!token) { error = 'Not authenticated.'; return; }

    const fd = new FormData();
    fd.append('drinkName', drinkName);
    fd.append('drinkCode', drinkCode);
    fd.append('typeOfDrink', typeOfDrink);
    fd.append('uom', uom);
    fd.append('packageQty', String(packageQty));
    fd.append('buyingPrice', String(buyingPrice));
    fd.append('sellingPrice', String(sellingPrice));
    if (file) fd.append('image', file);

    try {
      const res = await fetch(`${GATEWAY_URL}/api/bar/drinks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.data?.message || 'API error');
      success = 'Drink added.';
      drinkName = drinkCode = typeOfDrink = '';
      uom = 'bottles'; packageQty = 1; buyingPrice = sellingPrice = 0; file = null;
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<a href="/barista/drinks" class="back">← Back</a>
<h1>Add Drink</h1>

{#if success}<p class="success">{success}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={submit} class="form">
  <label>Drink Name <input bind:value={drinkName} required /></label>
  <label>Drink Code <input bind:value={drinkCode} required /></label>
  <label>Type <input bind:value={typeOfDrink} required /></label>
  <label>
    UOM
    <select bind:value={uom}>
      <option value="bottles">Bottles</option>
      <option value="crates">Crates</option>
      <option value="pack">Pack</option>
    </select>
  </label>
  <label>Package Qty <input type="number" bind:value={packageQty} min="1" required /></label>
  <label>Buying Price (KES) <input type="number" bind:value={buyingPrice} min="0" required /></label>
  <label>Selling Price (KES) <input type="number" bind:value={sellingPrice} min="0" required /></label>
  <label>Image <input type="file" accept="image/*" onchange={onFileChange} /></label>
  <button type="submit">Add Drink</button>
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
