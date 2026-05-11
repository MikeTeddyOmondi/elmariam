<script lang="ts">
  import { getMenuItems, getOrders } from '$lib/remote/restaurant.remote';

  const menuItems = getMenuItems();
  const orders = getOrders();
</script>

<h1>Dashboard</h1>

<div class="grid">
  {#await menuItems then data}
    <div class="card"><h3>Menu Items</h3><p class="number">{data.length}</p></div>
  {/await}
  {#await orders then data}
    <div class="card"><h3>Active Orders</h3><p class="number">{data.filter((o: any) => !['served','cancelled'].includes(o.status)).length}</p></div>
  {/await}
  {#await orders then data}
    <div class="card"><h3>Total Orders</h3><p class="number">{data.length}</p></div>
  {/await}
</div>

<style>
  h1 { margin: 0 0 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
  .card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  h3 { margin: 0 0 0.5rem; font-size: 0.85rem; color: #666; text-transform: uppercase; }
  .number { margin: 0; font-size: 2rem; font-weight: 700; color: #1a5276; }
</style>
