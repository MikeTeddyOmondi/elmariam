<script lang="ts">
  import { getRoomTypes } from '$lib/remote/hotel.remote';

  const roomTypes = getRoomTypes();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Room Types</h1>
    <p class="text-sm text-muted-foreground mt-1">Available room categories and rates</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await roomTypes}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Title','Type','Rate (KES)','Capacity','Description'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as rt}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{rt.title}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{rt.roomType}</td>
              <td class="px-4 py-3 text-foreground">KES {rt.rate?.toLocaleString()}</td>
              <td class="px-4 py-3 text-foreground">{rt.capacity}</td>
              <td class="px-4 py-3 text-muted-foreground">{rt.description || '—'}</td>
            </tr>
          {:else}
            <tr><td colspan="5" class="px-4 py-6 text-center text-sm text-muted-foreground">No room types found</td></tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
