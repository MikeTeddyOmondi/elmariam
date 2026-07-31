<script lang="ts">
  import { getBarPurchases, getDrinks, createBarPurchase, type BarPurchaseView, type DrinkView } from '$lib/remote/bar.remote';
  import {
    Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, Select, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError
  } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';

  let purchases: BarPurchaseView[] = $state([]);
  let drinks: DrinkView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    Promise.all([getBarPurchases(), getDrinks()])
      .then(([p, d]) => { purchases = p; drinks = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bar Purchases</h1>
    <p class="mt-1 text-sm text-muted-foreground">Stock received from suppliers</p>
  </div>

  <Card class="max-w-2xl">
    <CardHeader>
      <CardTitle class="text-base">Record Purchase</CardTitle>
    </CardHeader>
    <CardContent>
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

        <Form.Field>
          <Label for="receipt">Receipt #</Label>
          <Input id="receipt" placeholder="REC-001" {...createBarPurchase.fields.receiptNumber.as('text')} />
          <Form.FieldErrors issues={createBarPurchase.fields.receiptNumber.issues()} />
        </Form.Field>

        <Form.Field>
          <!-- Was a free-text "Drink ID or name" box, which meant typing a raw
               ObjectId. Now a picker over the actual catalogue. -->
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

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
    {:else if loadError}
      <CardContent class="py-6 text-sm text-destructive">{loadError}</CardContent>
    {:else}
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Product</TableHead>
              <TableHead class="text-right">Quantity</TableHead>
              <TableHead class="text-right">Stock Value</TableHead>
              <TableHead>Supplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each purchases as p}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{p.receiptNumber}</TableCell>
                <TableCell class="font-medium text-foreground">{p.product?.drinkName ?? '—'}</TableCell>
                <TableCell class="text-right text-muted-foreground">{p.quantity}</TableCell>
                <TableCell class="text-right text-muted-foreground">KES {p.stockValue?.toLocaleString()}</TableCell>
                <TableCell class="text-muted-foreground">{p.supplier}</TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={5} class="py-6 text-center text-muted-foreground">
                  No purchases found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </Card>
</div>
