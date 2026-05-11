<script lang="ts">
  import { getDrinks, getBarPurchases, getBarSales } from '$lib/remote/bar.remote';

  const drinks = getDrinks();
  const purchases = getBarPurchases();
  const sales = getBarSales();
</script>

<h1>Dashboard</h1>

<div class="grid">
  {#await drinks then data}
    <div class="card"><h3>Drinks</h3><p class="number">{data.length}</p></div>
  {/await}
  {#await drinks then data}
    <div class="card"><h3>In Stock</h3><p class="number">{data.filter((d: any) => d.inStock).length}</p></div>
  {/await}
  {#await purchases then data}
    <div class="card"><h3>Purchases</h3><p class="number">{data.length}</p></div>
  {/await}
  {#await sales then data}
    <div class="card"><h3>Sales</h3><p class="number">{data.length}</p></div>
  {/await}
</div>

<style>
  h1 { margin: 0 0 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
  .card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  h3 { margin: 0 0 0.5rem; font-size: 0.85rem; color: #666; text-transform: uppercase; }
  .number { margin: 0; font-size: 2rem; font-weight: 700; color: #2c3e50; }
</style>
