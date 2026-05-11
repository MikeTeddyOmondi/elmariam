<script lang="ts">
  import { getBarSales } from '$lib/remote/bar.remote';

  const sales = getBarSales();
</script>

<div class="header">
  <h1>Sales</h1>
  <a href="/barista/sales/new" class="btn">+ New Sale</a>
</div>

{#await sales}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr><th>Sale ID</th><th>Items</th><th>Total Stock Value</th></tr>
    </thead>
    <tbody>
      {#each data as sale}
        <tr>
          <td>{sale._id}</td>
          <td>{sale.drinks?.length ?? 0} item(s)</td>
          <td>KES {sale.totalStockValue?.toLocaleString()}</td>
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
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .error { color: red; }
</style>
