<script lang="ts">
  import { getDrinks, createDrink, type DrinkView } from '$lib/remote/bar.remote';
  import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, Select, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError
  } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';

  let drinks: DrinkView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });

  const DRINK_TYPES = ['spirit', 'beer', 'rtd', 'wine', 'water'] as const;
  const UNITS = ['bottles', 'crates', 'pack'] as const;
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bar Drinks</h1>
    <p class="mt-1 text-sm text-muted-foreground">Bar inventory catalogue</p>
  </div>

  <Card class="max-w-2xl">
    <CardHeader>
      <CardTitle class="text-base">Add Drink</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        {...createDrink.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) toast.success('Drink created.');
          } catch (e) {
            toastError(e);
          }
        })}
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="sm:col-span-2 empty:hidden">
          <Form.Message issues={createDrink.fields.issues?.()} />
        </div>

        <Form.Field>
          <Label for="drinkName">Name</Label>
          <Input id="drinkName" placeholder="e.g. Tusker Lager" {...createDrink.fields.drinkName.as('text')} />
          <Form.FieldErrors issues={createDrink.fields.drinkName.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="drinkCode">Code</Label>
          <Input id="drinkCode" placeholder="e.g. TUS001" {...createDrink.fields.drinkCode.as('text')} />
          <Form.FieldErrors issues={createDrink.fields.drinkCode.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="typeOfDrink">Type</Label>
          <Select id="typeOfDrink" class="capitalize" {...createDrink.fields.typeOfDrink.as('select', 'beer')}>
            {#each DRINK_TYPES as t}<option value={t}>{t}</option>{/each}
          </Select>
          <Form.FieldErrors issues={createDrink.fields.typeOfDrink.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="uom">Unit of Measure</Label>
          <Select id="uom" class="capitalize" {...createDrink.fields.uom.as('select', 'bottles')}>
            {#each UNITS as u}<option value={u}>{u}</option>{/each}
          </Select>
          <Form.FieldErrors issues={createDrink.fields.uom.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="packageQty">Package Qty</Label>
          <Input id="packageQty" min="1" {...createDrink.fields.packageQty.as('number')} />
          <Form.FieldErrors issues={createDrink.fields.packageQty.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="buyingPrice">Buying Price (KES)</Label>
          <Input id="buyingPrice" min="0" step="0.01" {...createDrink.fields.buyingStockPrice.as('number')} />
          <Form.FieldErrors issues={createDrink.fields.buyingStockPrice.issues()} />
        </Form.Field>

        <Form.Field class="sm:col-span-2">
          <Label for="sellingPrice">Selling Price (KES)</Label>
          <Input id="sellingPrice" min="0" step="0.01" {...createDrink.fields.sellingStockPrice.as('number')} />
          <Form.FieldErrors issues={createDrink.fields.sellingStockPrice.issues()} />
        </Form.Field>

        <div class="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={createDrink.pending > 0}>
            <Plus />
            {createDrink.pending > 0 ? 'Saving…' : 'Add Drink'}
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead class="text-right">Stock Qty</TableHead>
              <TableHead class="text-right">Selling Price</TableHead>
              <TableHead>In Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each drinks as drink}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{drink.drinkCode}</TableCell>
                <TableCell class="font-medium text-foreground">{drink.drinkName}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{drink.typeOfDrink}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{drink.uom}</TableCell>
                <TableCell class="text-right text-muted-foreground">{drink.stockQty}</TableCell>
                <TableCell class="text-right text-muted-foreground">KES {drink.sellingPrice?.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={drink.inStock ? 'success' : 'destructive'}>
                    {drink.inStock ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={7} class="py-6 text-center text-muted-foreground">
                  No drinks found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </Card>
</div>
