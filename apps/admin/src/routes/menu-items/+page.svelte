<script lang="ts">
  import {
    getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, type MenuItemView
  } from '$lib/remote/restaurant.remote';
  import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Form, Input, Label, SelectField,
    Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';

  let items: MenuItemView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMenuItems()
      .then((d) => { items = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });

  const CATEGORIES = ['appetizer', 'main', 'dessert', 'beverage', 'side'] as const;

  const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

  // Confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<{ id: string; label: string } | null>(null);

  // Editing happens inline, in a row that expands under the one being edited.
  // Only one row is open at a time.
  let editingId = $state<string | null>(null);
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Menu Items</h1>
    <p class="mt-1 text-sm text-muted-foreground">Restaurant menu and pricing</p>
  </div>

  <Card class="max-w-2xl">
    <CardHeader>
      <CardTitle class="text-base">Add Menu Item</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        {...createMenuItem.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) toast.success('Menu item created.');
          } catch (e) {
            toastError(e);
          }
        })}
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="sm:col-span-2 empty:hidden">
          <Form.Message issues={createMenuItem.fields.allIssues()} />
        </div>

        <Form.Field>
          <Label for="mname">Name</Label>
          <Input id="mname" placeholder="e.g. Grilled Chicken" {...createMenuItem.fields.name.as('text')} />
          <Form.FieldErrors issues={createMenuItem.fields.name.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="cat">Category</Label>
          <SelectField
            id="cat"
            class="capitalize"
            items={CATEGORY_OPTIONS}
            {...createMenuItem.fields.category.as('select', 'main')}
          />
          <Form.FieldErrors issues={createMenuItem.fields.category.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="mprice">Price (KES)</Label>
          <Input id="mprice" min="0" step="0.01" {...createMenuItem.fields.price.as('number')} />
          <Form.FieldErrors issues={createMenuItem.fields.price.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="desc">Description <span class="text-muted-foreground">(optional)</span></Label>
          <Input id="desc" placeholder="Short description…" {...createMenuItem.fields.description.as('text')} />
          <Form.FieldErrors issues={createMenuItem.fields.description.issues()} />
        </Form.Field>

        <div class="flex items-center gap-2 sm:col-span-2">
          <!-- A checkbox rather than a Yes/No select: `as('checkbox')` handles
               the on/absent FormData quirk so the schema stays a plain boolean. -->
          <Checkbox id="avail" {...createMenuItem.fields.isAvailable.as('checkbox')} />
          <Label for="avail">Available on the menu</Label>
        </div>

        <div class="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={createMenuItem.pending > 0}>
            <Plus />
            {createMenuItem.pending > 0 ? 'Saving…' : 'Add Item'}
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
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead class="text-right">Price (KES)</TableHead>
              <TableHead>Available</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each items as item}
              <TableRow>
                <TableCell class="font-medium text-foreground">{item.name}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{item.category}</TableCell>
                <TableCell class="text-right text-muted-foreground">{item.price?.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={item.isAvailable ? 'success' : 'secondary'}>
                    {item.isAvailable ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit {item.name}"
                      onclick={() => (editingId = editingId === item.id ? null : item.id)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive hover:text-destructive"
                      aria-label="Delete {item.name}"
                      onclick={() => (pendingDelete = { id: item.id, label: item.name })}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {#if editingId === item.id}
                {@const editForm = updateMenuItem.for(item.id)}
                <!--
                  A second row rather than inputs in the row above: a `<form>`
                  is not valid markup between a row and its cells, so the form
                  lives inside one spanning cell. `.for(id)` keeps pending state
                  and issues scoped to this row.
                -->
                <TableRow class="bg-secondary/20">
                  <TableCell colspan={5} class="py-4">
                    <form
                      {...editForm.enhance(async ({ submit }) => {
                        try {
                          const ok = await submit();
                          if (ok) {
                            toast.success('Menu item updated.');
                            editingId = null;
                          }
                        } catch (e) {
                          toastError(e);
                        }
                      })}
                      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-start"
                    >
                      <input type="hidden" name="id" value={item.id} />

                      <div class="sm:col-span-2 lg:col-span-4 empty:hidden">
                        <Form.Message issues={editForm.fields.allIssues()} />
                      </div>

                      <Form.Field>
                        <Label for="mn-{item.id}">Name</Label>
                        <Input id="mn-{item.id}" {...editForm.fields.name.as('text', item.name)} />
                        <Form.FieldErrors issues={editForm.fields.name.issues()} />
                      </Form.Field>

                      <Form.Field>
                        <Label for="mc-{item.id}">Category</Label>
                        <SelectField
                          id="mc-{item.id}"
                          class="capitalize"
                          items={CATEGORY_OPTIONS}
                          {...editForm.fields.category.as('select', item.category)}
                        />
                        <Form.FieldErrors issues={editForm.fields.category.issues()} />
                      </Form.Field>

                      <Form.Field>
                        <Label for="mp-{item.id}">Price (KES)</Label>
                        <Input id="mp-{item.id}" {...editForm.fields.price.as('number', item.price)} />
                        <Form.FieldErrors issues={editForm.fields.price.issues()} />
                      </Form.Field>

                      <Form.Field>
                        <Label for="md-{item.id}">Description</Label>
                        <Input
                          id="md-{item.id}"
                          {...editForm.fields.description.as('text', item.description ?? '')}
                        />
                        <Form.FieldErrors issues={editForm.fields.description.issues()} />
                      </Form.Field>

                      <div class="flex items-center gap-2 self-end pb-1">
                        <Checkbox
                          id="ma-{item.id}"
                          {...editForm.fields.isAvailable.as('checkbox', item.isAvailable)}
                        />
                        <Label for="ma-{item.id}" class="cursor-pointer">Available</Label>
                      </div>

                      <div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 self-end">
                        <Button variant="outline" type="button" onclick={() => (editingId = null)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={editForm.pending > 0}>
                          {editForm.pending > 0 ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </TableCell>
                </TableRow>
              {/if}
            {:else}
              <TableRow>
                <TableCell colspan={5} class="py-6 text-center text-muted-foreground">
                  No menu items found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </Card>
</div>

{#if pendingDelete}
  {@const target = pendingDelete}
  {@const deleteForm = deleteMenuItem.for(target.id)}
  <form
    id="delete-menuitem-form"
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
    title="Delete this menu item?"
    description="{target.label} will be removed. This cannot be undone."
    confirmLabel={deleteForm.pending > 0 ? 'Deleting…' : 'Delete'}
    destructive
    pending={deleteForm.pending > 0}
    confirmForm="delete-menuitem-form"
    onclose={() => (editingId = null)}
  />
{/if}
