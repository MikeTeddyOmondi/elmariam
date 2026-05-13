<script lang="ts">
  import { getOrders } from '$lib/remote/restaurant.remote';

  const orders = getOrders();

  const statusCls: Record<string, string> = {
    pending:    'bg-amber-500/15 text-amber-500',
    preparing:  'bg-blue-500/15 text-blue-400',
    ready:      'bg-purple-500/15 text-purple-400',
    served:     'bg-green-500/15 text-green-500',
    cancelled:  'bg-red-500/15 text-red-500',
  };
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Restaurant Orders</h1>
    <p class="text-sm text-muted-foreground mt-1">All table orders</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await orders}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Order ID','Table','Items','Total (KES)','Status','Payment'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as order}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{order._id}</td>
              <td class="px-4 py-3 text-foreground">{order.tableNumber ?? '—'}</td>
              <td class="px-4 py-3 text-foreground">{order.items?.length ?? 0}</td>
              <td class="px-4 py-3 text-foreground font-medium">{order.totalAmount?.toLocaleString() ?? '—'}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                  {statusCls[order.status] ?? 'bg-secondary text-muted-foreground'}">
                  {order.status}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{order.paymentStatus ?? '—'}</td>
            </tr>
          {:else}
            <tr><td colspan="6" class="px-4 py-6 text-center text-sm text-muted-foreground">No orders found</td></tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
