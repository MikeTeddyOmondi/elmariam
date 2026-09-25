<script lang="ts">
  import { createOrder, getMenuItems } from '$lib/remote/restaurant.remote';
  import { Button, Card, CardContent, Form, Input, Label, SelectField, toast, toastError } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import X from 'lucide-svelte/icons/x';

  let menuItems = $state<Awaited<ReturnType<typeof getMenuItems>>>([] as never);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMenuItems()
      .then((d) => { menuItems = d; loading = false; })
      .catch(() => { loading = false; });
  });

  const available = $derived(menuItems.filter((m: { isAvailable?: boolean }) => m.isAvailable));

  // Only the row count is client state. The values live on the form fields, so
  // `fields.items[i]` generates the indexed input names the schema expects.
  let rowCount = $state(1);

  const rows = $derived(Array.from({ length: rowCount }, (_, i) => i));

  const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank', label: 'Bank Transfer' }
  ];

  const menuOptions = $derived(
    available.map((m) => ({ value: m.id, label: `${m.name} (KES ${m.price?.toLocaleString()})` }))
  );
</script>

<div class="max-w-xl space-y-6">
  <div>
    <a href="/waiter/orders" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
      ← Back
    </a>
    <h1 class="mt-2 text-2xl font-bold text-foreground">New Order</h1>
  </div>

  <Card>
    <CardContent class="py-6">
      <form
        {...createOrder.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) {
              toast.success('Order created.');
              rowCount = 1;
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
            <div class="flex items-end gap-2">
              <div class="flex-1 space-y-2">
                <Label class="sr-only" for="item-{i}">Menu item</Label>
                <SelectField
                  id="item-{i}"
                  disabled={loading}
                  items={menuOptions}
                  placeholder={loading ? 'Loading' : 'Select item'}
                  {...row.menuItemId.as('select')}
                />
                <Form.FieldErrors issues={row.menuItemId.issues()} />
              </div>

              <div class="w-24 space-y-2">
                <Label class="sr-only" for="iqty-{i}">Quantity</Label>
                <Input id="iqty-{i}" min="1" placeholder="Qty" {...row.quantity.as('number', 1)} />
                <Form.FieldErrors issues={row.quantity.issues()} />
              </div>

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
          {/each}
          <!-- `issues()`, not `allIssues()`: the latter exists only on the `fields`
               root. On a single field, reading it returns a nested field proxy, so
               `?.()` does not guard and calling it kills hydration. This renders the
               array-level rule, e.g. "add at least one item". -->
          <Form.FieldErrors issues={createOrder.fields.items.issues()} />
        </div>

        <Button type="button" variant="outline" onclick={() => (rowCount += 1)}>
          <Plus /> Add Item
        </Button>

        <Button type="submit" class="w-full" disabled={createOrder.pending > 0}>
          {createOrder.pending > 0 ? 'Creating…' : 'Create Order'}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
