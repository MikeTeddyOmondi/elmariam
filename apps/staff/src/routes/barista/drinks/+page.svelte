<script lang="ts">
  import { getDrinks } from '$lib/remote/bar.remote';

  const drinks = getDrinks();
</script>

<div class="header">
  <h1>Drinks</h1>
  <a href="/barista/drinks/new" class="btn">+ Add Drink</a>
</div>

{#await drinks}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr><th>Code</th><th>Name</th><th>Type</th><th>UOM</th><th>Pkg Qty</th><th>Stock Qty</th><th>Selling Price</th><th>In Stock</th></tr>
    </thead>
    <tbody>
      {#each data as drink}
        <tr>
          <td>{drink.drinkCode}</td>
          <td>{drink.drinkName}</td>
          <td>{drink.typeOfDrink}</td>
          <td>{drink.uom}</td>
          <td>{drink.packageQty}</td>
          <td>{drink.stockQty}</td>
          <td>KES {drink.sellingPrice?.toLocaleString()}</td>
          <td><span class:yes={drink.inStock} class:no={!drink.inStock}>{drink.inStock ? 'Yes' : 'No'}</span></td>
        </tr>
      {/each}
    </tbody>
  </table>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  h1 { margin: 0; }
  .btn { background: #2c3e50; color: #fff; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .yes { color: #27ae60; font-weight: 600; }
  .no { color: #c0392b; font-weight: 600; }
  .error { color: red; }
</style>
