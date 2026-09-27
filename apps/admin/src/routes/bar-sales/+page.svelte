<script lang="ts">
  import { Pagination, SalePayActions } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getBarSales, getDrinks, checkoutBarSale, type BarSaleView } from '$lib/remote/bar.remote';
  import { chargeMpesa, sendSms } from '$lib/remote/payments.remote';
  import {
    Button, Card, CardContent, Dialog, Form, Input, Label, SelectField,
    Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    ReceiptDialog, type ReceiptData,
    toast, toastError } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import Printer from 'lucide-svelte/icons/printer';
  import ShoppingCart from 'lucide-svelte/icons/shopping-cart';
  import X from 'lucide-svelte/icons/x';
  import { can } from '$lib/permissions';

  let sales: BarSaleView[] = $state([]);
  let drinks = $state<Awaited<ReturnType<typeof getDrinks>>>([] as never);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getBarSales()
      .then((d) => { sales = d; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  // Failing to load the catalogue only disables the sale form, so it does not
  // set `loadError` and hide the sales table along with it.
  let drinksLoading = $state(true);

  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d; drinksLoading = false; })
      .catch(() => { drinksLoading = false; });
  });

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Receipt preview (shown after a checkout, and re-openable from any row).
  let receipt = $state<ReceiptData | null>(null);

  function receiptForSale(sale: BarSaleView): ReceiptData {
    return {
      subtitle: 'Bar Sale Receipt',
      reference: String(sale.id ?? '-'),
      date: sale.createdAt ? new Date(sale.createdAt) : new Date(),
      items: (sale.drinks ?? []).map((d) => ({
        name: drinks.find((x) => x.id === String(d.productID))?.drinkName ?? 'Drink',
        qty: d.qtyBought,
        amount: d.stockValue,
      })),
      totals: [
        { label: 'Subtotal', amount: sale.subTotal ?? 0 },
        { label: 'VAT (14%)', amount: sale.vat ?? 0 },
        { label: 'Levy (2%)', amount: sale.levy ?? 0 },
        { label: 'Total', amount: sale.totalStockValue ?? 0, strong: true },
      ],
    };
  }

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

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('bar_sales:write'));
  const canPay = $derived(can('payments:initiate'));
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Bar Sales</h1>
      <p class="text-sm text-muted-foreground mt-1">All recorded bar transactions</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <ShoppingCart />
        Record Sale
      </Button>
    {/if}
  </div>

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
{:else}
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale ID</TableHead>
              <TableHead>Items</TableHead>
              <TableHead class="text-right">Total Stock Value</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each sales.slice((__page - 1) * __perPage, __page * __perPage) as sale}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{sale.id}</TableCell>
                <TableCell class="text-foreground">{sale.drinks?.length ?? 0} item(s)</TableCell>
                <TableCell class="text-right font-medium text-foreground">
                  KES {sale.totalStockValue?.toLocaleString() ?? '-'}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    {#if canPay}
                      <SalePayActions
                        compact
                        amount={sale.totalStockValue ?? 0}
                        reference={sale.id}
                        smsMessage={`El'Mariam bar sale: your bill is KES ${(sale.totalStockValue ?? 0).toLocaleString()}. Thank you.`}
                        onMpesa={(phone) => chargeMpesa({ amount: sale.totalStockValue ?? 0, phone, reference: `bar-sale-${sale.id}` })}
                        onSms={(phone, message) => sendSms({ phone, message })}
                      />
                    {/if}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Print receipt for sale {sale.id}"
                      title="Print receipt"
                      onclick={() => (receipt = receiptForSale(sale))}
                    >
                      <Printer />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={4} class="py-6 text-center text-muted-foreground">
                  No sales found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={sales.length} perPage={__perPage} label="sales" />
      </div>
      </div>
    {/if}
  </Card>
</div>

{#if canWrite}
  <!--
    The cart is a dynamic list built in the browser rather than flat FormData
    fields, so this form is JS-driven and submitted through `enhance`.
  -->
  <Dialog
    open={showCreate}
    title="Record Sale"
    description="Add drinks to the cart and check out."
    pending={checkoutBarSale.pending > 0}
    onclose={() => {
      showCreate = false;
      rowCount = 1;
    }}
  >
    <form
      {...checkoutBarSale.enhance(async ({ submit }) => {
        try {
          // `submit()` resolves false on validation issues; it does not throw.
          const ok = await submit();
          if (ok) {
            toast.success('Sale recorded.');
            rowCount = 1;
            showCreate = false;
            // `.run()`, not `await getBarSales()`: the bare query is only
            // awaitable in a reactive context (the $effect loader above). Here
            // in an event handler it must be executed imperatively. The server
            // handler already single-flight `refresh()`es this query, so this
            // reads the freshly recomputed list.
            sales = await getBarSales().run();
            // Newest sale is first (sorted by createdAt desc): preview its receipt.
            if (sales[0]) receipt = receiptForSale(sales[0]);
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="space-y-4"
    >
      <Form.Message issues={checkoutBarSale.fields.allIssues()} />

      <div class="space-y-3">
        {#each rows as i (i)}
          {@const row = checkoutBarSale.fields.checkoutDrinkItems[i]}
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
              <Label for="drink-{i}">Drink</Label>
              <SelectField
                id="drink-{i}"
                disabled={drinksLoading}
                items={drinkOptions}
                placeholder={drinksLoading ? 'Loading' : 'Select drink'}
                {...row.drinkId.as('select')}
              />
              <Form.FieldErrors issues={row.drinkId.issues()} />
            </Form.Field>

            <Form.Field>
              <Label for="qty-{i}">Quantity</Label>
              <Input id="qty-{i}" min="1" placeholder="Qty" {...row.quantity.as('number', 1)} />
              <Form.FieldErrors issues={row.quantity.issues()} />
            </Form.Field>
          </div>
        {/each}
      </div>

      <div class="flex justify-between gap-2">
        <Button type="button" variant="outline" onclick={() => (rowCount += 1)}>
          <Plus /> Add Item
        </Button>
        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={checkoutBarSale.pending > 0}
            onclick={() => {
              showCreate = false;
              rowCount = 1;
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={checkoutBarSale.pending > 0 || drinksLoading}>
            {checkoutBarSale.pending > 0 ? 'Processing…' : 'Checkout'}
          </Button>
        </div>
      </div>
    </form>
  </Dialog>
{/if}

<ReceiptDialog
  open={receipt !== null}
  data={receipt}
  title="Bar Sale Receipt"
  onclose={() => (receipt = null)}
/>
