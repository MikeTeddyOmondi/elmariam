<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getCustomers, createCustomer } from '$lib/remote/hotel.remote';
  import {
    Alert, AlertDescription, Button, Dialog, Form, Input, Label,
    toast, toastError } from '@elmariam/ui';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import { can } from '$lib/permissions';

  type Row = Awaited<ReturnType<typeof getCustomers>>[number];

  let customers = $state<Row[]>([]);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getCustomers()
      .then((d) => { customers = d as Row[]; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  // Create lives in a modal opened from the header, not a separate route.
  let showCreate = $state(false);

  // Cosmetic: the remote function guards itself with `requirePermission`, so a
  // read-only role that posts directly still gets a 403. This just hides a
  // control that would only fail.
  const canWrite = $derived(can('customers:write'));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Customers</h1>
      <p class="text-sm text-muted-foreground mt-1">Registered guest records</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <UserPlus />
        New Customer
      </Button>
    {/if}
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
{:else}
      {@const data = customers.slice((__page - 1) * __perPage, __page * __perPage)}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Name','ID Number','Email','Phone'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as c}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground">{c.firstname} {c.lastname}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.id_number}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.email}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.phone_number || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={customers.length} perPage={__perPage} label="customers" />
      </div>
    </div>
  {/if}
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="New Customer"
    description="Register a new guest."
    pending={createCustomer.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <form
      {...createCustomer.enhance(async ({ submit }) => {
        try {
          // `submit()` resolves false on validation issues; it does not throw.
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
        <Label for="first">First Name</Label>
        <Input id="first" placeholder="John" {...createCustomer.fields.firstname.as('text')} />
        <Form.FieldErrors issues={createCustomer.fields.firstname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="last">Last Name</Label>
        <Input id="last" placeholder="Doe" {...createCustomer.fields.lastname.as('text')} />
        <Form.FieldErrors issues={createCustomer.fields.lastname.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="idnum">ID Number</Label>
        <Input id="idnum" placeholder="12345678" {...createCustomer.fields.id_number.as('text')} />
        <Form.FieldErrors issues={createCustomer.fields.id_number.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="email">Email</Label>
        <Input id="email" placeholder="john@example.com" {...createCustomer.fields.email.as('email')} />
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
          {createCustomer.pending > 0 ? 'Saving…' : 'Create Customer'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}
