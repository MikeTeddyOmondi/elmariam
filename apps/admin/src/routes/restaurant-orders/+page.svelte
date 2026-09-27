<script lang="ts">
  import { Pagination, SalePayActions } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getOrders, updateOrderStatus, markOrderPaid, type OrderView } from '$lib/remote/restaurant.remote';
  import { chargeMpesa, sendSms } from '$lib/remote/payments.remote';
  import { toast, toastError} from '@elmariam/ui';
  import { can } from '$lib/permissions';

  let orders: OrderView[] = $state([]);
  let loading = $state(true);

  // Cosmetic gating: the remote guards itself with `orders:pay`. Only admin
  // holds it, so waiters never see the control.
  const canPay = $derived(can('orders:pay'));
  const canNotify = $derived(can('payments:initiate'));

  $effect(() => {
    getOrders()
      .then(d => { orders = d; loading = false; })
      .catch(e => { toastError(e); loading = false; });
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

  async function markPaid(orderId: string, paymentMethod: 'cash' | 'mpesa' | 'bank') {
    updating = orderId;
    try {
      await markOrderPaid({ orderId, paymentMethod });
      toast.success('Order marked as paid.');
      orders = await getOrders();
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
          {#each orders.slice((__page - 1) * __perPage, __page * __perPage) as order}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{order.id}</td>
              <td class="px-4 py-3 text-foreground">{order.tableNumber ?? '-'}</td>
              <td class="px-4 py-3 text-foreground">{order.items?.length ?? 0}</td>
              <td class="px-4 py-3 text-foreground font-medium">{order.totalAmount?.toLocaleString() ?? '-'}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                  {statusCls[order.status] ?? 'bg-secondary text-muted-foreground'}">
                  {order.status}
                </span>
              </td>
              <td class="px-4 py-3">
                {#if order.paymentStatus === 'paid'}
                  <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize bg-green-500/15 text-green-500">
                    paid{order.paymentMethod ? ` · ${order.paymentMethod}` : ''}
                  </span>
                {:else if canPay}
                  <select
                    value=""
                    disabled={updating === order.id}
                    onchange={(e) => { const m = (e.target as HTMLSelectElement).value; if (m) markPaid(order.id, m as any); }}
                    class={selectCls}>
                    <option value="" disabled>Mark paid…</option>
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Card / Bank</option>
                  </select>
                {:else}
                  <span class="text-muted-foreground capitalize">{order.paymentStatus ?? '-'}</span>
                {/if}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <select
                    value={order.status}
                    disabled={updating === order.id}
                    onchange={(e) => changeStatus(order.id, (e.target as HTMLSelectElement).value as any)}
                    class={selectCls}>
                    {#each statuses as s}
                      <option value={s}>{s}</option>
                    {/each}
                  </select>
                  {#if canNotify}
                    <SalePayActions
                      compact
                      amount={order.totalAmount ?? 0}
                      reference={order.id}
                      smsMessage={`El'Mariam restaurant: your bill is KES ${(order.totalAmount ?? 0).toLocaleString()}. Thank you.`}
                      onMpesa={(phone) => chargeMpesa({ amount: order.totalAmount ?? 0, phone, reference: `restaurant-order-${order.id}` })}
                      onSms={(phone, message) => sendSms({ phone, message })}
                    />
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr><td colspan="7" class="px-4 py-6 text-center text-sm text-muted-foreground">No orders found</td></tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={orders.length} perPage={__perPage} label="orders" />
      </div>
    {/if}
  </div>
</div>
