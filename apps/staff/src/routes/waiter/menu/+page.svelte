<script lang="ts">
  import { getMenuItems } from '$lib/remote/restaurant.remote';
  import { Alert, AlertDescription } from '@elmariam/ui';

  const menuItems = getMenuItems();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Menu</h1>
    <p class="text-sm text-muted-foreground mt-1">Available restaurant items</p>
  </div>

  {#await menuItems}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:then data}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Name','Category','Price (KES)','Available'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as item}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{item.name}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{item.category}</td>
              <td class="px-4 py-3 text-muted-foreground">KES {item.price?.toLocaleString()}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                  {item.isAvailable ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}">
                  {item.isAvailable ? 'Yes' : 'No'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:catch err}
    <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
  {/await}
</div>
