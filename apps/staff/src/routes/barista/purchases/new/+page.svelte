<script lang="ts">
  import { createBarPurchase, getDrinks } from '$lib/remote/bar.remote';
  import { Button, Card, CardContent, Form, Input, Label, Select, toast, toastError } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';

  let drinks = $state<Awaited<ReturnType<typeof getDrinks>>>([] as never);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d; loading = false; })
      .catch(() => { loading = false; });
  });
</script>

<div class="max-w-lg space-y-6">
  <div>
    <a href="/barista/purchases" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
      ← Back
    </a>
    <h1 class="mt-2 text-2xl font-bold text-foreground">Record Purchase</h1>
  </div>

  <Card>
    <CardContent class="py-6">
      <form
        {...createBarPurchase.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) toast.success('Purchase recorded.');
          } catch (e) {
            toastError(e);
          }
        })}
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="sm:col-span-2 empty:hidden">
          <Form.Message issues={createBarPurchase.fields.issues?.()} />
        </div>

        <Form.Field class="sm:col-span-2">
          <Label for="receipt">Receipt #</Label>
          <Input id="receipt" placeholder="REC-001" {...createBarPurchase.fields.receiptNumber.as('text')} />
          <Form.FieldErrors issues={createBarPurchase.fields.receiptNumber.issues()} />
        </Form.Field>

        <Form.Field class="sm:col-span-2">
          <Label for="product">Product</Label>
          <Select id="product" disabled={loading} {...createBarPurchase.fields.product.as('select')}>
            <option value="">{loading ? 'Loading…' : 'Select drink'}</option>
            {#each drinks as d}
              <option value={d.id}>{d.drinkName} ({d.drinkCode})</option>
            {/each}
          </Select>
          <Form.FieldErrors issues={createBarPurchase.fields.product.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="qty">Quantity</Label>
          <Input id="qty" min="1" {...createBarPurchase.fields.quantity.as('number')} />
          <Form.FieldErrors issues={createBarPurchase.fields.quantity.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="supplier">Supplier</Label>
          <Input id="supplier" placeholder="Supplier name" {...createBarPurchase.fields.supplier.as('text')} />
          <Form.FieldErrors issues={createBarPurchase.fields.supplier.issues()} />
        </Form.Field>

        <div class="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={createBarPurchase.pending > 0}>
            <Plus />
            {createBarPurchase.pending > 0 ? 'Saving…' : 'Record Purchase'}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
