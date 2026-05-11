<script lang="ts">
  import { getCustomers } from '$lib/remote/hotel.remote';

  const customers = getCustomers();
</script>

<div class="header">
  <h1>Customers</h1>
  <a href="/receptionist/customers/new" class="btn">+ New Customer</a>
</div>

{#await customers}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr><th>Name</th><th>ID Number</th><th>Email</th><th>Phone</th></tr>
    </thead>
    <tbody>
      {#each data as c}
        <tr>
          <td>{c.firstname} {c.lastname}</td>
          <td>{c.id_number}</td>
          <td>{c.email}</td>
          <td>{c.phone_number || '-'}</td>
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
  .btn { background: #0f3460; color: #fff; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .error { color: red; }
</style>
