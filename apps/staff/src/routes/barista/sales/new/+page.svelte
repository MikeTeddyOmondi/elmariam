<script lang="ts">
  import { checkoutBarSale, getDrinks } from '$lib/remote/bar.remote';
  import { Button, Card, CardContent, Form, Input, Label, Select, toast, toastError } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import X from 'lucide-svelte/icons/x';

  let drinks = $state<Awaited<ReturnType<typeof getDrinks>>>([] as never);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d; loading = false; })
      .catch(() => { loading = false; });
  });

  // Only the row count is client state. The values themselves live on the form
  // fields, so `fields.checkoutDrinkItems[i]` generates the indexed input names
  // the server schema expects.
  let rowCount = $state(1);

  const rows = $derived(Array.from({ length: rowCount }, (_, i) => i));
</script>

<div class="max-w-xl space-y-6">
  <div>
    <a href="/barista/sales" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
      ← Back
    </a>
    <h1 class="mt-2 text-2xl font-bold text-foreground">New Sale</h1>
  </div>

  <Card>
    <CardContent class="py-6">
      <form
        {...checkoutBarSale.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) {
              toast.success('Sale recorded.');
              rowCount = 1;
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
                <Select id="drink-{i}" disabled={loading} {...row.drinkId.as('select')}>
                  <option value="">{loading ? 'Loading…' : 'Select drink'}</option>
                  {#each drinks as d}
                    <option value={d.id}>{d.drinkName} ({d.drinkCode}) — stock: {d.stockQty}</option>
                  {/each}
                </Select>
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

        <Button type="button" variant="outline" onclick={() => (rowCount += 1)}>
          <Plus /> Add Item
        </Button>

        <Button type="submit" class="w-full" disabled={checkoutBarSale.pending > 0}>
          {checkoutBarSale.pending > 0 ? 'Processing…' : 'Checkout'}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
