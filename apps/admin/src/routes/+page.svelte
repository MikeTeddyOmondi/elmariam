<script lang="ts">
  import { getDashboardStats } from '$lib/remote/analytics.remote';

  const stats = getDashboardStats();
</script>

<h1>Dashboard</h1>

{#await stats}
  <p>Loading stats…</p>
{:then data}
  <div class="grid">
    <div class="card">
      <h3>Bookings</h3>
      <p class="number">{Array.isArray(data.bookings) ? data.bookings.length : 0}</p>
    </div>
    <div class="card">
      <h3>Invoices</h3>
      <p class="number">{Array.isArray(data.invoices) ? data.invoices.length : 0}</p>
    </div>
    <div class="card">
      <h3>Bar Sales</h3>
      <p class="number">{Array.isArray(data.sales) ? data.sales.length : 0}</p>
    </div>
    <div class="card">
      <h3>Restaurant Orders</h3>
      <p class="number">{Array.isArray(data.orders) ? data.orders.length : 0}</p>
    </div>
  </div>
{:catch err}
  <p class="error">Failed to load stats: {err.message}</p>
{/await}

<style>
  h1 { margin: 0 0 1.5rem; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
  .card {
    background: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }
  h3 { margin: 0 0 0.5rem; font-size: 0.9rem; color: #666; text-transform: uppercase; }
  .number { margin: 0; font-size: 2rem; font-weight: 700; color: #1a1a2e; }
  .error { color: red; }
</style>
