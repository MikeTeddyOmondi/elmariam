<script lang="ts">
  import { getOrders, updateOrderStatus, type OrderView } from '$lib/remote/restaurant.remote';
  import { toast } from '@elmariam/ui';

  let orders: OrderView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => {
    getOrders()
      .then(d => { orders = d; loading = false; })
      .catch(e => { loadError = e.message; loading = false; });
  });

  const statusCls: Record<string, string> = {
    pending:   'bg-amber-500/15 text-amber-500',
    preparing: 'bg-blue-500/15 text-blue-400',
    ready:     'bg-purple-500/15 text-purple-400',
    served:    'bg-green-500/15 text-green-500',
    cancelled: 'bg-red-500/15 text-red-500',
  };

  const statuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'] as const;
  let updating = $state<string | null>(null);

  async function changeStatus(orderId: string, status: typeof statuses[number]) {
    updating = orderId;
    try {
      await updateOrderStatus({ orderId, status });
      getOrders().then(d => { orders = d; }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { updating = null; }
  }

  const selectCls = 'bg-background border border-input rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer';
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Restaurant Orders</h1>
    <p class="text-sm text-muted-foreground mt-1">All table orders</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if loading}
      <div class="divide-y divide-border">
        <div class="h-10 bg-secondary/50 animate-pulse rounded"></div>
        {#each Array(5) as _}
          <div class="flex gap-3 px-4 py-3">
            <div class="h-4 w-24 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-12 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-12 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-20 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-20 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-16 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-28 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Order ID','Table','Items','Total (KES)','Status','Payment','Update Status'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each orders as order}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{order.id}</td>
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
              <td class="px-4 py-3">
                <select
                  value={order.status}
                  disabled={updating === order.id}
                  onchange={(e) => changeStatus(order.id, (e.target as HTMLSelectElement).value as any)}
                  class={selectCls}>
                  {#each statuses as s}
                    <option value={s}>{s}</option>
                  {/each}
                </select>
              </td>
            </tr>
          {:else}
            <tr><td colspan="7" class="px-4 py-6 text-center text-sm text-muted-foreground">No orders found</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
