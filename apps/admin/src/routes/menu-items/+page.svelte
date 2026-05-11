<script lang="ts">
  import { getMenuItems } from '$lib/remote/restaurant.remote';

  const menuItems = getMenuItems();
</script>

<h1>Menu Items</h1>

{#await menuItems}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Price (KES)</th>
        <th>Available</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {#each data as item}
        <tr>
          <td>{item.name}</td>
          <td>{item.category}</td>
          <td>{item.price?.toLocaleString()}</td>
          <td>
            <span class:yes={item.isAvailable} class:no={!item.isAvailable}>
              {item.isAvailable ? 'Yes' : 'No'}
            </span>
          </td>
          <td>{item.description || '-'}</td>
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
  .yes { color: #27ae60; font-weight: 600; }
  .no { color: #c0392b; font-weight: 600; }
  .error { color: red; }
</style>
