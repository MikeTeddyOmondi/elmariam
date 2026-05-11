<script lang="ts">
  import { getOrders, updateOrderStatus } from '$lib/remote/restaurant.remote';

  const orders = getOrders();

  const TRANSITIONS: Record<string, string[]> = {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['served'],
  };

  let msg = $state('');

  async function advance(orderId: string, status: string) {
    msg = '';
    try {
      await updateOrderStatus({ orderId, status });
      msg = `Order marked as ${status}.`;
    } catch (err: any) {
      msg = err.message;
    }
  }

  const statusColor: Record<string, string> = {
    pending: '#f39c12', preparing: '#2980b9', ready: '#8e44ad', served: '#27ae60', cancelled: '#c0392b',
  };
</script>

<div class="header">
  <h1>Orders</h1>
  <a href="/waiter/orders/new" class="btn">+ New Order</a>
</div>

{#if msg}<p class="msg">{msg}</p>{/if}

{#await orders}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr><th>Order ID</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
    </thead>
    <tbody>
      {#each data as order}
        <tr>
          <td>{order._id}</td>
          <td>{order.tableNumber ?? '-'}</td>
          <td>{order.items?.length ?? 0}</td>
          <td>KES {order.totalAmount?.toLocaleString()}</td>
          <td><span style="color: {statusColor[order.status] ?? '#333'}; font-weight:600;">{order.status}</span></td>
          <td class="actions">
            {#each TRANSITIONS[order.status] ?? [] as next}
              <button onclick={() => advance(order._id, next)}>{next}</button>
            {/each}
          </td>
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
  .btn { background: #1a5276; color: #fff; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  button { padding: 0.3rem 0.6rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; background: #1a5276; color: #fff; }
  .msg { color: #27ae60; }
  .error { color: red; }
</style>
