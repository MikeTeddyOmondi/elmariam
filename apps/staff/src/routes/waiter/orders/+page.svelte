<script lang="ts">
  import { getOrders, updateOrderStatus } from '$lib/remote/restaurant.remote';
  import { Button, Alert, AlertDescription, messageFor } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getOrders>>[number];

  let orders = $state<Row[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getOrders()
      .then((d) => { orders = d as Row[]; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
  type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending:   ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready:     ['served'],
  };

  const statusClass: Record<string, string> = {
    pending:   'bg-yellow-400/10 text-yellow-400',
    preparing: 'bg-blue-400/10 text-blue-400',
    ready:     'bg-purple-400/10 text-purple-400',
    served:    'bg-green-400/10 text-green-400',
    cancelled: 'bg-red-400/10 text-red-400',
  };

  let msg = $state('');
  let msgError = $state(false);

  async function advance(orderId: string, status: OrderStatus) {
    msg = '';
    msgError = false;
    try {
      await updateOrderStatus({ orderId, status });
      msg = `Order marked as ${status}.`;
    } catch (err: any) {
      msg = err.message;
      msgError = true;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Orders</h1>
      <p class="text-sm text-muted-foreground mt-1">Manage restaurant orders</p>
    </div>
    <a href="/waiter/orders/new"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      + New Order
    </a>
  </div>

  {#if msg}
    <Alert variant={msgError ? 'destructive' : 'default'}>
      <AlertDescription>{msg}</AlertDescription>
    </Alert>
  {/if}

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:else if loadError}
    <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
  {:else}
      {@const data = orders}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Order ID','Table','Items','Total','Status','Actions'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as order}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{order.id}</td>
              <td class="px-4 py-3 text-muted-foreground">{order.tableNumber ?? '-'}</td>
              <td class="px-4 py-3 text-muted-foreground">{order.items?.length ?? 0}</td>
              <td class="px-4 py-3 text-foreground font-medium">KES {order.totalAmount?.toLocaleString()}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {statusClass[order.status] ?? 'bg-secondary text-muted-foreground'}">
                  {order.status}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1.5">
                  {#each TRANSITIONS[order.status] ?? [] as next}
                    <Button variant="outline" onclick={() => advance(order.id, next)} class="h-7 px-2 text-xs capitalize">{next}</Button>
                  {/each}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
