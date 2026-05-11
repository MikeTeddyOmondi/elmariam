<script lang="ts">
  import { getOrders } from '$lib/remote/restaurant.remote';

  const orders = getOrders();

  const statusColor: Record<string, string> = {
    pending: '#f39c12',
    preparing: '#2980b9',
    ready: '#8e44ad',
    served: '#27ae60',
    cancelled: '#c0392b',
  };
</script>

<h1>Restaurant Orders</h1>

{#await orders}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Order ID</th>
        <th>Table</th>
        <th>Items</th>
        <th>Total (KES)</th>
        <th>Status</th>
        <th>Payment</th>
      </tr>
    </thead>
    <tbody>
      {#each data as order}
        <tr>
          <td>{order._id}</td>
          <td>{order.tableNumber ?? '-'}</td>
          <td>{order.items?.length ?? 0}</td>
          <td>{order.totalAmount?.toLocaleString()}</td>
          <td>
            <span style="color: {statusColor[order.status] ?? '#333'}; font-weight: 600;">
              {order.status}
            </span>
          </td>
          <td>{order.paymentStatus}</td>
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
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .error { color: red; }
</style>
