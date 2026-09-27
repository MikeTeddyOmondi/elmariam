<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getBarPurchases } from '$lib/remote/bar.remote';
  import { toastError } from '@elmariam/ui';

  type Row = Awaited<ReturnType<typeof getBarPurchases>>[number];

  let purchases = $state<Row[]>([]);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    getBarPurchases()
      .then((d) => { purchases = d as Row[]; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Purchases</h1>
      <!-- Read-only: receiving stock is an admin process, recorded in the admin
           app. This page exists so a barista can see what came in. -->
      <p class="text-sm text-muted-foreground mt-1">Stock purchase records, recorded by admin</p>
    </div>
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
{:else}
      {@const data = purchases.slice((__page - 1) * __perPage, __page * __perPage)}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Receipt #','Product','Quantity','Supplier','Stock Value'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as p}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{p.receiptNumber}</td>
              <td class="px-4 py-3 text-foreground">{p.product?.drinkName ?? p.product}</td>
              <td class="px-4 py-3 text-muted-foreground">{p.quantity}</td>
              <td class="px-4 py-3 text-muted-foreground">{p.supplier}</td>
              <td class="px-4 py-3 text-muted-foreground">KES {p.stockValue?.toLocaleString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={purchases.length} perPage={__perPage} label="purchases" />
      </div>
    </div>
  {/if}
</div>
