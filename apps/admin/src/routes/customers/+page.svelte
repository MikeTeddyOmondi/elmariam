<script lang="ts">
  import { getCustomers } from '$lib/remote/hotel.remote';

  const customers = getCustomers();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Customers</h1>
    <p class="text-sm text-muted-foreground mt-1">Registered hotel guests</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await customers}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Name','ID Number','Email','Phone'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as c}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{c.firstname} {c.lastname}</td>
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{c.id_number}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.email}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.phone_number || '—'}</td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-4 py-6 text-center text-sm text-muted-foreground">No customers found</td></tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
