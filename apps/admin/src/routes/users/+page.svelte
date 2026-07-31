<script lang="ts">
  import { getUsers, createUser, deleteUser, type UserView } from "$lib/remote/users.remote";
  import {
    AlertDialog,
    Button,
    Form,
    Input,
    Label,
    Select,
    Skeleton,
    messageFor,
    toast,
    toastError
  } from "@elmariam/ui";
  import { ASSIGNABLE_STAFF_ROLES } from "@elmariam/auth";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import UserPlus from "lucide-svelte/icons/user-plus";

  let users: UserView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getUsers()
      .then(d => { users = d; loading = false; })
      .catch(e => { loadError = messageFor(e); loading = false; });
  });

  // Delete is confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<UserView | null>(null);

  const typeCls: Record<string, string> = {
    admin: 'bg-purple-500/15 text-purple-400',
    receptionist: 'bg-blue-500/15 text-blue-400',
    barista: 'bg-amber-500/15 text-amber-500',
    waiter: 'bg-green-500/15 text-green-500',
    management: 'bg-pink-500/15 text-pink-400',
  };
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Users</h1>
    <p class="text-sm text-muted-foreground mt-1">Staff accounts and roles</p>
  </div>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add User</h2>

    <!--
      A `form()` remote function, so this still submits without JavaScript.
      `enhance` only adds the toast on top of the normal submission.
    -->
    <form
      {...createUser.enhance(async ({ submit }) => {
        try {
          await submit();
          toast.success('User created.');
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start"
    >
      <!--
        `issues()` is form-level only. `allIssues()` would also include every
        field's issues, duplicating what renders inline under each input.
      -->
      <div class="sm:col-span-2 lg:col-span-3 empty:hidden">
        <Form.Message issues={createUser.fields.issues?.()} />
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

      <Form.Field>
        <Label for="utype">Role</Label>
        <!-- Defaulted explicitly: without it the first option wins, which
             would make `admin` the default role for every new user. -->
        <Select id="utype" {...createUser.fields.userType.as('select', 'receptionist')}>
          {#each ASSIGNABLE_STAFF_ROLES as t}
            <option value={t}>{t}</option>
          {/each}
        </Select>
        <Form.FieldErrors issues={createUser.fields.userType.issues()} />
      </Form.Field>

      <div class="sm:col-span-2 flex justify-end self-end">
        <Button type="submit" disabled={createUser.pending > 0}>
          <UserPlus />
          {createUser.pending > 0 ? 'Saving…' : 'Add User'}
        </Button>
      </div>
    </form>
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
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
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
          {#each users as user}
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
                <!-- Icon-only, so it needs an accessible name of its own. -->
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
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-4 py-6 text-center text-sm text-muted-foreground">No users found</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

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
        await submit();
        toast.success(`${target.firstname} ${target.lastname} deleted.`.trim());
        pendingDelete = null;
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
  />
{/if}
