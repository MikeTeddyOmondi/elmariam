<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getDrinks, createDrink, updateDrink, type DrinkView, deleteDrink } from '$lib/remote/bar.remote';
  import {
    Badge, Button, Card, CardContent, Dialog, Form, Input, Label, SelectField, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import { can } from '$lib/permissions';

  let drinks: DrinkView[] = $state([]);
  let loading = $state(true);

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Editing happens in a modal. Only one drink is open at a time.
  let editingId = $state<string | null>(null);
  const editing = $derived(drinks.find((d) => d.id === editingId) ?? null);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getDrinks()
      .then((d) => { drinks = d; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  const DRINK_TYPES = ['spirit', 'beer', 'rtd', 'wine', 'water'] as const;
  const UNITS = ['bottles', 'crates', 'pack'] as const;

  const DRINK_TYPE_OPTIONS = DRINK_TYPES.map((t) => ({ value: t, label: t }));
  const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));

  // Confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<{ id: string; label: string } | null>(null);

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('drinks:write'));
  const canDelete = $derived(can('drinks:delete'));
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Bar Drinks</h1>
      <p class="mt-1 text-sm text-muted-foreground">Bar inventory catalogue</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <Plus />
        Add Drink
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead class="text-right">Stock Qty</TableHead>
              <TableHead class="text-right">Selling Price</TableHead>
              <TableHead>In Stock</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each drinks.slice((__page - 1) * __perPage, __page * __perPage) as drink}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{drink.drinkCode}</TableCell>
                <TableCell class="font-medium text-foreground">{drink.drinkName}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{drink.typeOfDrink}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{drink.uom}</TableCell>
                <TableCell class="text-right text-muted-foreground">{drink.stockQty}</TableCell>
                <!-- `sellingStockPrice` is the field the create form writes. `sellingPrice`
                     has no writer anywhere and stays at its schema default of 0. -->
                <TableCell class="text-right text-muted-foreground">KES {drink.sellingStockPrice?.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={drink.inStock ? 'success' : 'destructive'}>
                    {drink.inStock ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-1">
                    {#if canWrite}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit {drink.drinkName}"
                        onclick={() => (editingId = drink.id)}
                      >
                        <Pencil />
                      </Button>
                    {/if}
                    {#if canDelete}
                      <Button
                        variant="ghost"
                        size="icon"
                        class="text-destructive hover:text-destructive"
                        aria-label="Delete {drink.drinkName}"
                        onclick={() => (pendingDelete = { id: drink.id, label: drink.drinkName })}
                      >
                        <Trash2 />
                      </Button>
                    {/if}
                  </div>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={8} class="py-6 text-center text-muted-foreground">
                  No drinks found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={drinks.length} perPage={__perPage} label="drinks" />
      </div>
      </div>
    {/if}
  </Card>
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="Add Drink"
    description="Add a drink to the bar catalogue."
    pending={createDrink.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <form
      {...createDrink.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Drink created.');
            showCreate = false;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={createDrink.fields.allIssues()} />
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
        <SelectField
          id="typeOfDrink"
          class="capitalize"
          items={DRINK_TYPE_OPTIONS}
          {...createDrink.fields.typeOfDrink.as('select', 'beer')}
        />
        <Form.FieldErrors issues={createDrink.fields.typeOfDrink.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="uom">Unit of Measure</Label>
        <SelectField
          id="uom"
          class="capitalize"
          items={UNIT_OPTIONS}
          {...createDrink.fields.uom.as('select', 'bottles')}
        />
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

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={createDrink.pending > 0}
          onclick={() => (showCreate = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createDrink.pending > 0}>
          <Plus />
          {createDrink.pending > 0 ? 'Saving…' : 'Add Drink'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

{#if canWrite && editing}
  {@const drink = editing}
  {@const editForm = updateDrink.for(drink.id)}
  <Dialog
    open={true}
    title="Edit Drink"
    description="Update {drink.drinkName}. Stock is managed through purchases and sales."
    pending={editForm.pending > 0}
    onclose={() => (editingId = null)}
  >
    <form
      {...editForm.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Drink updated.');
            editingId = null;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={drink.id} />

      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={editForm.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="edn-{drink.id}">Name</Label>
        <Input id="edn-{drink.id}" {...editForm.fields.drinkName.as('text', drink.drinkName)} />
        <Form.FieldErrors issues={editForm.fields.drinkName.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="edc-{drink.id}">Code</Label>
        <Input id="edc-{drink.id}" {...editForm.fields.drinkCode.as('text', drink.drinkCode)} />
        <Form.FieldErrors issues={editForm.fields.drinkCode.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="edt-{drink.id}">Type</Label>
        <SelectField
          id="edt-{drink.id}"
          class="capitalize"
          items={DRINK_TYPE_OPTIONS}
          {...editForm.fields.typeOfDrink.as('select', drink.typeOfDrink)}
        />
        <Form.FieldErrors issues={editForm.fields.typeOfDrink.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="edu-{drink.id}">Unit of Measure</Label>
        <SelectField
          id="edu-{drink.id}"
          class="capitalize"
          items={UNIT_OPTIONS}
          {...editForm.fields.uom.as('select', drink.uom)}
        />
        <Form.FieldErrors issues={editForm.fields.uom.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="edpq-{drink.id}">Package Qty</Label>
        <Input id="edpq-{drink.id}" min="1" {...editForm.fields.packageQty.as('number', drink.packageQty)} />
        <Form.FieldErrors issues={editForm.fields.packageQty.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="edbp-{drink.id}">Buying Price (KES)</Label>
        <Input id="edbp-{drink.id}" min="0" step="0.01" {...editForm.fields.buyingStockPrice.as('number', drink.buyingStockPrice)} />
        <Form.FieldErrors issues={editForm.fields.buyingStockPrice.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="edsp-{drink.id}">Selling Price (KES)</Label>
        <Input id="edsp-{drink.id}" min="0" step="0.01" {...editForm.fields.sellingStockPrice.as('number', drink.sellingStockPrice)} />
        <Form.FieldErrors issues={editForm.fields.sellingStockPrice.issues()} />
      </Form.Field>

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={editForm.pending > 0} onclick={() => (editingId = null)}>
          Cancel
        </Button>
        <Button type="submit" disabled={editForm.pending > 0}>
          {editForm.pending > 0 ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

{#if pendingDelete}
  {@const target = pendingDelete}
  {@const deleteForm = deleteDrink.for(target.id)}
  <form
    id="delete-drink-form"
    {...deleteForm.enhance(async ({ submit }) => {
      try {
        const ok = await submit();
        if (ok) {
          toast.success(`${target.label} deleted.`);
          pendingDelete = null;
        } else {
          // A refused delete (a dependant exists) comes back as a form-level
          // issue. The hidden delete form has nowhere to render it, so without
          // this the dialog just sits there saying nothing.
          toastIssues(deleteForm.fields.allIssues());
        }
      } catch (e) {
        toastError(e);
      }
    })}
  >
    <input type="hidden" name="id" value={target.id} />
  </form>

  <AlertDialog
    open={true}
    title="Delete this drink?"
    description="{target.label} will be removed. This cannot be undone."
    confirmLabel={deleteForm.pending > 0 ? 'Deleting' : 'Delete'}
    destructive
    pending={deleteForm.pending > 0}
    confirmForm="delete-drink-form"
    onclose={() => (pendingDelete = null)}
  />
{/if}
