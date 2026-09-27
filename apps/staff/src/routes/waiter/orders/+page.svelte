<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getOrders, getMenuItems, createOrder, updateOrderStatus } from '$lib/remote/restaurant.remote';
  import { chargeMpesa, sendSms } from '$lib/remote/payments.remote';
  import {
    Button, Dialog, Form, Input, Label, SelectField,
    ReceiptDialog, type ReceiptData, SalePayActions,
    toast, toastError } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import Printer from 'lucide-svelte/icons/printer';
  import X from 'lucide-svelte/icons/x';
  import { can } from '$lib/permissions';

  type Row = Awaited<ReturnType<typeof getOrders>>[number];

  let orders = $state<Row[]>([]);

  // Receipt preview (after a create, and re-openable from any row).
  let receipt = $state<ReceiptData | null>(null);

  function receiptForOrder(o: Row): ReceiptData {
    const meta = [];
    if (o.tableNumber) meta.push({ label: 'Table', value: String(o.tableNumber) });
    if (o.paymentMethod) meta.push({ label: 'Payment', value: String(o.paymentMethod) });
    meta.push({ label: 'Status', value: o.status });
    return {
      subtitle: 'Restaurant Order',
      reference: o.id,
      date: o.createdAt ? new Date(o.createdAt) : new Date(),
      meta,
      items: (o.items ?? []).map((it) => ({
        name: menuItems.find((m: { id: string }) => m.id === it.menuItem)?.name ?? it.menuItem,
        qty: it.quantity,
        amount: (it.price ?? 0) * it.quantity,
      })),
      totals: [
        { label: 'Subtotal', amount: o.subTotal ?? 0 },
        { label: 'VAT (14%)', amount: o.vat ?? 0 },
        { label: 'Levy (2%)', amount: o.levy ?? 0 },
        { label: 'Total', amount: o.totalAmount ?? 0, strong: true },
      ],
    };
  }
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getOrders()
      .then((d) => { orders = d as Row[]; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  // Create lives in a modal opened from the header, not a separate route.
  let showCreate = $state(false);

  // The item picker needs the menu. A failure only disables the form, so it
  // does not set `loadError` and hide the orders table with it.
  let menuItems = $state<Awaited<ReturnType<typeof getMenuItems>>>([] as never);
  let menuLoading = $state(true);

  $effect(() => {
    getMenuItems()
      .then((d) => { menuItems = d; menuLoading = false; })
      .catch(() => { menuLoading = false; });
  });

  const available = $derived(menuItems.filter((m: { isAvailable?: boolean }) => m.isAvailable));

  const menuOptions = $derived(
    available.map((m) => ({ value: m.id, label: `${m.name} (KES ${m.price?.toLocaleString()})` }))
  );

  const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank', label: 'Bank Transfer' }
  ];

  // Only the row count is client state. The values live on the form fields, so
  // `fields.items[i]` generates the indexed input names the schema expects.
  let rowCount = $state(1);

  const rows = $derived(Array.from({ length: rowCount }, (_, i) => i));

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

  async function advance(orderId: string, status: OrderStatus) {
    try {
      await updateOrderStatus({ orderId, status });
      toast.success(`Order marked as ${status}.`);
    } catch (err) {
      toastError(err);
    }
  }

  // Cosmetic: the create route guards itself in +page.server.ts, and the
  // remote function guards itself too. This just hides a link that would
  // only 403 for a read-only role.
  const canWrite = $derived(can('orders:write'));
  const canPay = $derived(can('payments:initiate'));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Orders</h1>
      <p class="text-sm text-muted-foreground mt-1">Manage restaurant orders</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <Plus />
        New Order
      </Button>
    {/if}
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
{:else}
      {@const data = orders.slice((__page - 1) * __perPage, __page * __perPage)}
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
                <div class="flex items-center gap-1.5">
                  {#each TRANSITIONS[order.status] ?? [] as next}
                    <Button variant="outline" onclick={() => advance(order.id, next)} class="h-7 px-2 text-xs capitalize">{next}</Button>
                  {/each}
                  {#if canPay}
                    <SalePayActions
                      compact
                      amount={order.totalAmount ?? 0}
                      reference={order.id}
                      smsMessage={`El'Mariam restaurant: your bill is KES ${(order.totalAmount ?? 0).toLocaleString()}. Thank you.`}
                      onMpesa={(phone) => chargeMpesa({ amount: order.totalAmount ?? 0, phone, reference: `restaurant-order-${order.id}` })}
                      onSms={(phone, message) => sendSms({ phone, message })}
                    />
                  {/if}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    aria-label="Print receipt for order {order.id}"
                    title="Print receipt"
                    onclick={() => (receipt = receiptForOrder(order))}
                  >
                    <Printer />
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={orders.length} perPage={__perPage} label="orders" />
      </div>
    </div>
  {/if}
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="New Order"
    description="Add menu items to the order and submit."
    pending={createOrder.pending > 0}
    onclose={() => {
      showCreate = false;
      rowCount = 1;
    }}
  >
    <form
      {...createOrder.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Order created.');
            rowCount = 1;
            showCreate = false;
            // Refresh + preview the newest order's receipt (list is desc).
            orders = (await getOrders().run()) as Row[];
            if (orders[0]) receipt = receiptForOrder(orders[0]);
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="space-y-4"
    >
      <Form.Message issues={createOrder.fields.allIssues()} />

      <div class="grid gap-4 sm:grid-cols-2">
        <Form.Field>
          <Label for="table">Table # <span class="text-muted-foreground">(optional)</span></Label>
          <Input id="table" min="1" {...createOrder.fields.tableNumber.as('number')} />
          <Form.FieldErrors issues={createOrder.fields.tableNumber.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="pay">Payment Method</Label>
          <SelectField
            id="pay"
            items={PAYMENT_OPTIONS}
            {...createOrder.fields.paymentMethod.as('select', 'cash')}
          />
          <Form.FieldErrors issues={createOrder.fields.paymentMethod.issues()} />
        </Form.Field>
      </div>

      <div class="space-y-3">
        <Label>Items</Label>
        {#each rows as i (i)}
          {@const row = createOrder.fields.items[i]}
          <!-- Each line item is a stacked, labelled block, not an inline row, so
               it reads the same as every other form field. -->
          <div class="space-y-3 rounded-lg border border-border p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">Item {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive"
                aria-label="Remove item {i + 1}"
                disabled={rowCount === 1}
                onclick={() => (rowCount -= 1)}
              >
                <X />
              </Button>
            </div>

            <Form.Field>
              <Label for="item-{i}">Menu item</Label>
              <SelectField
                id="item-{i}"
                disabled={menuLoading}
                items={menuOptions}
                placeholder={menuLoading ? 'Loading' : 'Select item'}
                {...row.menuItemId.as('select')}
              />
              <Form.FieldErrors issues={row.menuItemId.issues()} />
            </Form.Field>

            <Form.Field>
              <Label for="iqty-{i}">Quantity</Label>
              <Input id="iqty-{i}" min="1" placeholder="Qty" {...row.quantity.as('number', 1)} />
              <Form.FieldErrors issues={row.quantity.issues()} />
            </Form.Field>
          </div>
        {/each}
        <!-- `issues()`, not `allIssues()`: the latter exists only on the `fields`
             root. On a single field, reading it returns a nested field proxy, so
             `?.()` does not guard and calling it kills hydration. This renders the
             array-level rule, e.g. "add at least one item". -->
        <Form.FieldErrors issues={createOrder.fields.items.issues()} />
      </div>

      <div class="flex justify-between gap-2">
        <Button type="button" variant="outline" onclick={() => (rowCount += 1)}>
          <Plus /> Add Item
        </Button>
        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={createOrder.pending > 0}
            onclick={() => {
              showCreate = false;
              rowCount = 1;
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createOrder.pending > 0}>
            {createOrder.pending > 0 ? 'Creating…' : 'Create Order'}
          </Button>
        </div>
      </div>
    </form>
  </Dialog>
{/if}

<ReceiptDialog
  open={receipt !== null}
  data={receipt}
  title="Order Receipt"
  onclose={() => (receipt = null)}
/>
