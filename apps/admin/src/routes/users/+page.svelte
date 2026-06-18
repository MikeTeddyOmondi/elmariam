<script lang="ts">
  import { getUsers, createUser, deleteUser } from '$lib/remote/users.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  const users = getUsers();

  let username     = $state('');
  let firstname    = $state('');
  let lastname     = $state('');
  let email        = $state('');
  let id_number    = $state('');
  let phone_number = $state('');
  let userType     = $state<'admin'|'receptionist'|'barista'|'waiter'|'management'>('receptionist');
  let saving       = $state(false);
  let deleting     = $state<string | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    try {
      await createUser({ username, firstname, lastname, email, id_number, phone_number: phone_number || undefined, userType });
      toast.success(`User ${username} created.`);
      username = ''; firstname = ''; lastname = ''; email = ''; id_number = ''; phone_number = '';
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { saving = false; }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    deleting = id;
    try {
      await deleteUser({ id });
      toast.success(`${name} deleted.`);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { deleting = null; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
  const typeCls: Record<string, string> = {
    admin:        'bg-purple-500/15 text-purple-400',
    receptionist: 'bg-blue-500/15 text-blue-400',
    barista:      'bg-amber-500/15 text-amber-500',
    waiter:       'bg-green-500/15 text-green-500',
    management:   'bg-pink-500/15 text-pink-400',
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
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="uname">Username</label>
        <input id="uname" bind:value={username} placeholder="jdoe" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="ufname">First Name</label>
        <input id="ufname" bind:value={firstname} placeholder="John" class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="ulname">Last Name</label>
        <input id="ulname" bind:value={lastname} placeholder="Doe" class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="uemail">Email</label>
        <input id="uemail" type="email" bind:value={email} placeholder="john@example.com" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="uidno">ID Number</label>
        <input id="uidno" bind:value={id_number} placeholder="12345678" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="uphone">Phone (optional)</label>
        <input id="uphone" bind:value={phone_number} placeholder="+254700000000" class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="utype">Role</label>
        <select id="utype" bind:value={userType} required class={selectCls}>
          {#each ['admin','receptionist','barista','waiter','management'] as t}
            <option value={t}>{t}</option>
          {/each}
        </select>
      </div>
      <div class="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add User'}</Button>
      </div>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await users}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Name','Email','Role',''] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as user}
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
                <button
                  onclick={() => remove(user.id, `${user.firstname} ${user.lastname}`)}
                  disabled={deleting === user.id}
                  class="text-xs text-destructive hover:underline disabled:opacity-50">
                  {deleting === user.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-4 py-6 text-center text-sm text-muted-foreground">No users found</td></tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
