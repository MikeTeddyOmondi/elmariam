<script lang="ts">
  import { getCustomers, createCustomer, updateCustomer, type CustomerView, deleteCustomer } from '$lib/remote/hotel.remote';
  import {
    Button, Card, CardContent, Dialog, Form, Input, Label, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Pagination, toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import { can } from '$lib/permissions';

  let customers: CustomerView[] = $state([]);
  let loading = $state(true);

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Editing happens in a modal. Only one customer is open at a time.
  let editingId = $state<string | null>(null);
  const editing = $derived(customers.find((c) => c.id === editingId) ?? null);

  // Client-side pagination over the loaded rows.
  let page = $state(1);
  const perPage = 10;
  const pagedCustomers = $derived(customers.slice((page - 1) * perPage, page * perPage));

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getCustomers()
      .then((d) => { customers = d; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  // Confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<{ id: string; label: string } | null>(null);

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('customers:write'));
  const canDelete = $derived(can('customers:delete'));
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Customers</h1>
      <p class="mt-1 text-sm text-muted-foreground">Registered hotel guests</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <UserPlus />
        Add Customer
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
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each pagedCustomers as c}
              <TableRow>
                <TableCell class="font-medium text-foreground">{c.firstname} {c.lastname}</TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">{c.id_number}</TableCell>
                <TableCell class="text-muted-foreground">{c.email}</TableCell>
                <TableCell class="text-muted-foreground">{c.phone_number || '-'}</TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-1">
                    {#if canWrite}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit {`${c.firstname} ${c.lastname}`}"
                        onclick={() => (editingId = c.id)}
                      >
                        <Pencil />
                      </Button>
                    {/if}
                    {#if canDelete}
                      <Button
                        variant="ghost"
                        size="icon"
                        class="text-destructive hover:text-destructive"
                        aria-label="Delete {`${c.firstname} ${c.lastname}`}"
                        onclick={() => (pendingDelete = { id: c.id, label: `${c.firstname} ${c.lastname}` })}
                      >
                        <Trash2 />
                      </Button>
                    {/if}
                  </div>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={5} class="py-6 text-center text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
      <div class="px-4 pb-3">
        <Pagination bind:page total={customers.length} {perPage} label="customers" />
      </div>
    {/if}
  </Card>
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="Add Customer"
    description="Register a new hotel guest."
    pending={createCustomer.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <form
      {...createCustomer.enhance(async ({ submit }) => {
        try {
          // `submit()` resolves false on validation issues; it does not throw.
          // Only a successful post closes the modal; issues keep it open.
          const ok = await submit();
          if (ok) {
            toast.success('Customer created.');
            showCreate = false;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={createCustomer.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="fname">First Name</Label>
        <Input id="fname" placeholder="John" {...createCustomer.fields.firstname.as('text')} />
        <Form.FieldErrors issues={createCustomer.fields.firstname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="lname">Last Name</Label>
        <Input id="lname" placeholder="Doe" {...createCustomer.fields.lastname.as('text')} />
        <Form.FieldErrors issues={createCustomer.fields.lastname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="idno">ID Number</Label>
        <Input id="idno" placeholder="12345678" {...createCustomer.fields.id_number.as('text')} />
        <Form.FieldErrors issues={createCustomer.fields.id_number.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="cemail">Email</Label>
        <Input id="cemail" placeholder="john@example.com" {...createCustomer.fields.email.as('email')} />
        <Form.FieldErrors issues={createCustomer.fields.email.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="phone">Phone <span class="text-muted-foreground">(optional)</span></Label>
        <Input id="phone" placeholder="+254700000000" {...createCustomer.fields.phone_number.as('tel')} />
        <Form.FieldErrors issues={createCustomer.fields.phone_number.issues()} />
      </Form.Field>

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={createCustomer.pending > 0}
          onclick={() => (showCreate = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createCustomer.pending > 0}>
          <UserPlus />
          {createCustomer.pending > 0 ? 'Saving…' : 'Add Customer'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

{#if canWrite && editing}
  {@const c = editing}
  {@const editForm = updateCustomer.for(c.id)}
  <Dialog
    open={true}
    title="Edit Customer"
    description="Update {c.firstname} {c.lastname}. ID number cannot be changed."
    pending={editForm.pending > 0}
    onclose={() => (editingId = null)}
  >
    <form
      {...editForm.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Customer updated.');
            editingId = null;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={c.id} />

      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={editForm.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="ef-{c.id}">First Name</Label>
        <Input id="ef-{c.id}" {...editForm.fields.firstname.as('text', c.firstname)} />
        <Form.FieldErrors issues={editForm.fields.firstname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="el-{c.id}">Last Name</Label>
        <Input id="el-{c.id}" {...editForm.fields.lastname.as('text', c.lastname)} />
        <Form.FieldErrors issues={editForm.fields.lastname.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="ee-{c.id}">Email</Label>
        <Input id="ee-{c.id}" {...editForm.fields.email.as('email', c.email)} />
        <Form.FieldErrors issues={editForm.fields.email.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="ep-{c.id}">Phone <span class="text-muted-foreground">(optional)</span></Label>
        <Input id="ep-{c.id}" {...editForm.fields.phone_number.as('tel', c.phone_number ? String(c.phone_number) : '')} />
        <Form.FieldErrors issues={editForm.fields.phone_number.issues()} />
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
  {@const deleteForm = deleteCustomer.for(target.id)}
  <form
    id="delete-customer-form"
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
    title="Delete this customer?"
    description="{target.label} will be removed. This cannot be undone."
    confirmLabel={deleteForm.pending > 0 ? 'Deleting' : 'Delete'}
    destructive
    pending={deleteForm.pending > 0}
    confirmForm="delete-customer-form"
    onclose={() => (pendingDelete = null)}
  />
{/if}
