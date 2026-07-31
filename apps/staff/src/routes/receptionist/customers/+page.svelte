<script lang="ts">
  import { getCustomers } from '$lib/remote/hotel.remote';
  import { Alert, AlertDescription, messageFor } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getCustomers>>[number];

  let customers = $state<Row[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getCustomers()
      .then((d) => { customers = d as Row[]; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Customers</h1>
      <p class="text-sm text-muted-foreground mt-1">Registered guest records</p>
    </div>
    <a href="/receptionist/customers/new"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      + New Customer
    </a>
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:else if loadError}
    <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>
  {:else}
      {@const data = customers}
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
    </div>
  {/if}
</div>
