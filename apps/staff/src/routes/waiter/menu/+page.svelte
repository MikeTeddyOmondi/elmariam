<script lang="ts">
  import { getMenuItems } from '$lib/remote/restaurant.remote';
  import { Alert, AlertDescription, messageFor } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getMenuItems>>[number];

  let menuItems = $state<Row[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMenuItems()
      .then((d) => { menuItems = d as Row[]; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Menu</h1>
    <p class="text-sm text-muted-foreground mt-1">Available restaurant items</p>
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:else if loadError}
    <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
  {:else}
      {@const data = menuItems}
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
  {/if}
</div>
