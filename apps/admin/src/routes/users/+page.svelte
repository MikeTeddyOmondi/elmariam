<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import {
    getUsers, createUser, updateUser, deleteUser, type UserView
  } from "$lib/remote/users.remote";
  import {
    AlertDialog,
    Button,
    Checkbox,
    Dialog,
    Form,
    Input,
    Label,
    SelectField,
    Skeleton,
    toast,
    toastError, toastIssues
  } from "@elmariam/ui";
  import { ASSIGNABLE_STAFF_ROLES } from "@elmariam/auth";
  import Pencil from "lucide-svelte/icons/pencil";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import UserPlus from "lucide-svelte/icons/user-plus";
  import { can } from "$lib/permissions";

  let users: UserView[] = $state([]);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getUsers()
      .then(d => { users = d; loading = false; })
      .catch(e => { toastError(e); loading = false; });
  });

  // Delete is confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<UserView | null>(null);

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Editing happens in a modal. Only one user is open at a time.
  let editingId = $state<string | null>(null);
  const editing = $derived(users.find((u) => u.id === editingId) ?? null);

  const typeCls: Record<string, string> = {
    admin: 'bg-purple-500/15 text-purple-400',
    receptionist: 'bg-blue-500/15 text-blue-400',
    barista: 'bg-amber-500/15 text-amber-500',
    waiter: 'bg-green-500/15 text-green-500',
    management: 'bg-pink-500/15 text-pink-400',
  };

  const ROLE_OPTIONS = ASSIGNABLE_STAFF_ROLES.map((r) => ({ value: r, label: r }));

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('users:write'));
  const canDelete = $derived(can('users:delete'));
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Users</h1>
      <p class="text-sm text-muted-foreground mt-1">Staff accounts and roles</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <UserPlus />
        Add User
      </Button>
    {/if}
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if loading}
      <div class="divide-y divide-border">
        <Skeleton class="h-10 rounded-none" />
        {#each { length: 5 } as _}
          <div class="flex gap-4 px-4 py-3">
            <Skeleton class="h-4 flex-1" />
            <Skeleton class="h-4 w-40" />
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-4 w-12" />
          </div>
        {/each}
      </div>
{:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Name','Email','Role',''] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each users.slice((__page - 1) * __perPage, __page * __perPage) as user}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{user.firstname} {user.lastname}</td>
              <td class="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                  {typeCls[user.userType] ?? 'bg-secondary text-muted-foreground'}">
                  {user.userType}
                </span>
              </td>
              <td class="px-4 py-3">
                <!-- Icon-only, so each needs an accessible name of its own. -->
                <div class="flex justify-end gap-1">
                  {#if canWrite}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit {user.email}"
                      title="Edit user"
                      onclick={() => (editingId = editingId === user.id ? null : user.id)}
                    >
                      <Pencil />
                    </Button>
                  {/if}
                  {#if canDelete}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive hover:text-destructive"
                      aria-label="Delete {user.email}"
                      title="Delete user"
                      onclick={() => (pendingDelete = user)}
                    >
                      <Trash2 />
                    </Button>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-4 py-6 text-center text-sm text-muted-foreground">No users found</td></tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={users.length} perPage={__perPage} label="users" />
      </div>
    {/if}
  </div>
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="Add User"
    description="Create a staff account and assign a role."
    pending={createUser.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <!--
      A `form()` remote function, so this still submits without JavaScript.
      `enhance` only adds the toast on top of the normal submission.
    -->
    <form
      {...createUser.enhance(async ({ submit }) => {
        try {
          // `submit()` resolves to false when the server returns validation
          // issues: it does not throw. Only a successful post closes the modal.
          const ok = await submit();
          if (ok) {
            toast.success('User created.');
            showCreate = false;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <!--
        `allIssues()` is the only issue accessor on `fields`. `Form.Message`
        keeps the path-less entries, so a domain failure from `invalid()` shows
        here while field errors stay inline under their input.
      -->
      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={createUser.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="uname">Username</Label>
        <Input id="uname" placeholder="jdoe" {...createUser.fields.username.as('text')} />
        <Form.FieldErrors issues={createUser.fields.username.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="ufname">First Name</Label>
        <Input id="ufname" placeholder="John" {...createUser.fields.firstname.as('text')} />
        <Form.FieldErrors issues={createUser.fields.firstname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="ulname">Last Name</Label>
        <Input id="ulname" placeholder="Doe" {...createUser.fields.lastname.as('text')} />
        <Form.FieldErrors issues={createUser.fields.lastname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="uemail">Email</Label>
        <Input id="uemail" placeholder="john@example.com" {...createUser.fields.email.as('email')} />
        <Form.FieldErrors issues={createUser.fields.email.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="uidno">ID Number</Label>
        <Input id="uidno" placeholder="12345678" {...createUser.fields.id_number.as('text')} />
        <Form.FieldErrors issues={createUser.fields.id_number.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="uphone">Phone (optional)</Label>
        <Input id="uphone" placeholder="+254700000000" {...createUser.fields.phone_number.as('tel')} />
        <Form.FieldErrors issues={createUser.fields.phone_number.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="utype">Role</Label>
        <!-- Defaulted explicitly: without it the first option wins, which
             would make `admin` the default role for every new user. -->
        <SelectField
          id="utype"
          class="capitalize"
          items={ROLE_OPTIONS}
          {...createUser.fields.userType.as('select', 'receptionist')}
        />
        <Form.FieldErrors issues={createUser.fields.userType.issues()} />
      </Form.Field>

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={createUser.pending > 0}
          onclick={() => (showCreate = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createUser.pending > 0}>
          <UserPlus />
          {createUser.pending > 0 ? 'Saving…' : 'Add User'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

{#if canWrite && editing}
  {@const user = editing}
  {@const editForm = updateUser.for(user.id)}
  <!-- `.for(id)` keeps pending state and issues scoped to this user. -->
  <Dialog
    open={true}
    title="Edit User"
    description="Update {user.firstname} {user.lastname}."
    pending={editForm.pending > 0}
    onclose={() => (editingId = null)}
  >
    <form
      {...editForm.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('User updated.');
            editingId = null;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={user.id} />

      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={editForm.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="ef-{user.id}">First Name</Label>
        <Input id="ef-{user.id}" {...editForm.fields.firstname.as('text', user.firstname ?? '')} />
        <Form.FieldErrors issues={editForm.fields.firstname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="el-{user.id}">Last Name</Label>
        <Input id="el-{user.id}" {...editForm.fields.lastname.as('text', user.lastname ?? '')} />
        <Form.FieldErrors issues={editForm.fields.lastname.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="ep-{user.id}">Phone</Label>
        <Input
          id="ep-{user.id}"
          {...editForm.fields.phone_number.as('tel', user.phone_number ? String(user.phone_number) : '')}
        />
        <Form.FieldErrors issues={editForm.fields.phone_number.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="et-{user.id}">Role</Label>
        <SelectField
          id="et-{user.id}"
          class="capitalize"
          items={ROLE_OPTIONS}
          {...editForm.fields.userType.as('select', user.userType)}
        />
        <Form.FieldErrors issues={editForm.fields.userType.issues()} />
      </Form.Field>

      <div class="flex items-center gap-2 sm:col-span-2">
        <Checkbox id="ea-{user.id}" {...editForm.fields.isActive.as('checkbox', user.isActive)} />
        <Label for="ea-{user.id}" class="cursor-pointer">Active</Label>
      </div>

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={editForm.pending > 0}
          onclick={() => (editingId = null)}
        >
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
  {@const deleteForm = deleteUser.for(target.id)}
  <!--
    `.for(id)` gives each row its own form instance, so pending state and
    issues stay scoped to the row being deleted.
  -->
  <form
    id="delete-user-form"
    {...deleteForm.enhance(async ({ submit }) => {
      try {
        const ok = await submit();
        if (ok) {
          toast.success(`${target.firstname} ${target.lastname} deleted.`.trim());
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
    title="Delete this user?"
    description="{target.email} will lose access immediately. This cannot be undone."
    confirmLabel={deleteForm.pending > 0 ? 'Deleting…' : 'Delete'}
    destructive
    pending={deleteForm.pending > 0}
    confirmForm="delete-user-form"
    onclose={() => (pendingDelete = null)}
  />
{/if}
