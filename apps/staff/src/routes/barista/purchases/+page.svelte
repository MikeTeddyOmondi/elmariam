<script lang="ts">
  import { getBarPurchases } from '$lib/remote/bar.remote';

  const purchases = getBarPurchases();
</script>

<div class="header">
  <h1>Purchases</h1>
  <a href="/barista/purchases/new" class="btn">+ New Purchase</a>
</div>

{#await purchases}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr><th>Receipt #</th><th>Product</th><th>Quantity</th><th>Supplier</th><th>Stock Value</th></tr>
    </thead>
    <tbody>
      {#each data as p}
        <tr>
          <td>{p.receiptNumber}</td>
          <td>{p.product?.drinkName ?? p.product}</td>
          <td>{p.quantity}</td>
          <td>{p.supplier}</td>
          <td>KES {p.stockValue?.toLocaleString()}</td>
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
