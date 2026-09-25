<script lang="ts">
  import { getBarSales, getDrinks, checkoutBarSale, type BarSaleView } from '$lib/remote/bar.remote';
  import {
    Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, SelectField,
    Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import X from 'lucide-svelte/icons/x';

  let sales: BarSaleView[] = $state([]);
  let drinks = $state<Awaited<ReturnType<typeof getDrinks>>>([] as never);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getBarSales()
      .then((d) => { sales = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });

  // Failing to load the catalogue only disables the sale form, so it does not
  // set `loadError` and hide the sales table along with it.
  let drinksLoading = $state(true);

  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d; drinksLoading = false; })
      .catch(() => { drinksLoading = false; });
  });

  // Only the row count is client state. The values themselves live on the form
  // fields, so `fields.checkoutDrinkItems[i]` generates the indexed input names
  // the server schema expects.
  let rowCount = $state(1);

  const rows = $derived(Array.from({ length: rowCount }, (_, i) => i));

  const drinkOptions = $derived(
    drinks.map((d) => ({
      value: d.id,
      label: `${d.drinkName} (${d.drinkCode}), stock: ${d.stockQty}`
    }))
  );
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bar Sales</h1>
    <p class="text-sm text-muted-foreground mt-1">All recorded bar transactions</p>
  </div>

  <!--
    The cart is a dynamic list built in the browser rather than flat FormData
    fields, so this form is JS-driven and submitted through `enhance`.
  -->
  <Card class="max-w-xl">
    <CardHeader>
      <CardTitle class="text-base font-semibold text-foreground">Record Sale</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        {...checkoutBarSale.enhance(async ({ submit }) => {
          try {
            // `submit()` resolves false on validation issues; it does not throw.
            const ok = await submit();
            if (ok) {
              toast.success('Sale recorded.');
              rowCount = 1;
              sales = await getBarSales();
            }
          } catch (e) {
            toastError(e);
          }
        })}
        class="space-y-4"
      >
        <Form.Message issues={checkoutBarSale.fields.issues?.()} />

        <div class="space-y-3">
          {#each rows as i (i)}
            {@const row = checkoutBarSale.fields.checkoutDrinkItems[i]}
            <div class="flex items-end gap-2">
              <div class="flex-1 space-y-2">
                <Label class="sr-only" for="drink-{i}">Drink</Label>
                <SelectField
                  id="drink-{i}"
                  disabled={drinksLoading}
                  items={drinkOptions}
                  placeholder={drinksLoading ? 'Loading' : 'Select drink'}
                  {...row.drinkId.as('select')}
                />
                <Form.FieldErrors issues={row.drinkId.issues()} />
              </div>

              <div class="w-24 space-y-2">
                <Label class="sr-only" for="qty-{i}">Quantity</Label>
                <Input id="qty-{i}" min="1" placeholder="Qty" {...row.quantity.as('number', 1)} />
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
        </div>

        <div class="flex justify-between gap-2">
          <Button type="button" variant="outline" onclick={() => (rowCount += 1)}>
            <Plus /> Add Item
          </Button>
          <Button type="submit" disabled={checkoutBarSale.pending > 0 || drinksLoading}>
            {checkoutBarSale.pending > 0 ? 'Processing…' : 'Checkout'}
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
              <TableHead>Sale ID</TableHead>
              <TableHead>Items</TableHead>
              <TableHead class="text-right">Total Stock Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each sales as sale}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{sale.id}</TableCell>
                <TableCell class="text-foreground">{sale.drinks?.length ?? 0} item(s)</TableCell>
                <TableCell class="text-right font-medium text-foreground">
                  KES {sale.totalStockValue?.toLocaleString() ?? '-'}
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={3} class="py-6 text-center text-muted-foreground">
                  No sales found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </Card>
</div>
