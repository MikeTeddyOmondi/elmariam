<script lang="ts">
  import { getUsers } from '$lib/remote/users.remote';

  const users = getUsers();

  const typeCls: Record<string, string> = {
    admin:        'bg-purple-500/15 text-purple-400',
    receptionist: 'bg-blue-500/15 text-blue-400',
    barista:      'bg-amber-500/15 text-amber-500',
    waiter:       'bg-green-500/15 text-green-500',
  };
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Users</h1>
    <p class="text-sm text-muted-foreground mt-1">Staff accounts and roles</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await users}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Name','Email','Role'] as h}
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
            </tr>
          {:else}
            <tr><td colspan="3" class="px-4 py-6 text-center text-sm text-muted-foreground">No users found</td></tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
