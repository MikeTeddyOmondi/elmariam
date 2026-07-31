<script lang="ts">
  import { getMenuItems, createMenuItem, type MenuItemView } from '$lib/remote/restaurant.remote';
  import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Form, Input, Label, Select,
    Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError
  } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';

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
          <Form.Message issues={createMenuItem.fields.issues?.()} />
        </div>

        <Form.Field>
          <Label for="mname">Name</Label>
          <Input id="mname" placeholder="e.g. Grilled Chicken" {...createMenuItem.fields.name.as('text')} />
          <Form.FieldErrors issues={createMenuItem.fields.name.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="cat">Category</Label>
          <Select id="cat" class="capitalize" {...createMenuItem.fields.category.as('select', 'main')}>
            {#each CATEGORIES as c}<option value={c}>{c}</option>{/each}
          </Select>
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
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={4} class="py-6 text-center text-muted-foreground">
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
