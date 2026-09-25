<script lang="ts">
  import { getCustomers, createCustomer, type CustomerView, deleteCustomer } from '$lib/remote/hotel.remote';
  import {
    Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import { can } from '$lib/permissions';

  let customers: CustomerView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getCustomers()
      .then((d) => { customers = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
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
  <div>
    <h1 class="text-2xl font-bold text-foreground">Customers</h1>
    <p class="mt-1 text-sm text-muted-foreground">Registered hotel guests</p>
  </div>

  <!--
    Constrained width rather than the full page: a six-field form stretched
    across a wide monitor is hard to scan, and the two-column grid collapses to
    one on mobile.
  -->
  {#if canWrite}
    <Card class="max-w-2xl">
      <CardHeader>
        <CardTitle class="text-base">Add Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          {...createCustomer.enhance(async ({ submit }) => {
            try {
              // `submit()` resolves false on validation issues; it does not throw.
              const ok = await submit();
              if (ok) toast.success('Customer created.');
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

          <div class="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={createCustomer.pending > 0}>
              <UserPlus />
              {createCustomer.pending > 0 ? 'Saving…' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  {/if}

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
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each customers as c}
              <TableRow>
                <TableCell class="font-medium text-foreground">{c.firstname} {c.lastname}</TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">{c.id_number}</TableCell>
                <TableCell class="text-muted-foreground">{c.email}</TableCell>
                <TableCell class="text-muted-foreground">{c.phone_number || '-'}</TableCell>
                <TableCell class="text-right">
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
    {/if}
  </Card>
</div>

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
