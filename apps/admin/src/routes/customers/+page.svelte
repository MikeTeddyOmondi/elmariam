<script lang="ts">
  import { getCustomers } from '$lib/remote/hotel.remote';

  const customers = getCustomers();
</script>

<h1>Customers</h1>

{#await customers}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>ID Number</th>
        <th>Email</th>
        <th>Phone</th>
      </tr>
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
  h1 { margin: 0 0 1.5rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .error { color: red; }
</style>
