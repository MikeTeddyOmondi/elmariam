<script lang="ts">
  import { getBarPurchases, createBarPurchase } from '$lib/remote/bar.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let purchases: any[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => {
    getBarPurchases()
      .then(d => { purchases = d; loading = false; })
      .catch(e => { loadError = e.message; loading = false; });
  });

  let receiptNumber = $state('');
  let product = $state('');
  let quantity = $state(0);
  let supplier = $state('');
  let saving = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    try {
      await createBarPurchase({ receiptNumber, product, quantity, supplier });
      toast.success('Purchase recorded.');
      receiptNumber = ''; product = ''; quantity = 0; supplier = '';
      getBarPurchases().then(d => { purchases = d; }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-foreground">Bar Purchases</h1>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Record Purchase</h2>
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="receipt">Receipt #</label>
        <input id="receipt" bind:value={receiptNumber} placeholder="REC-001" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="product">Product (Drink ID)</label>
        <input id="product" bind:value={product} placeholder="Drink ID or name" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="qty">Quantity</label>
        <input id="qty" type="number" min="1" bind:value={quantity} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="supplier">Supplier</label>
        <input id="supplier" bind:value={supplier} placeholder="Supplier name" required class={inputCls} />
      </div>
      <div class="sm:col-span-2 lg:col-span-4 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Purchase'}</Button>
      </div>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if loading}
      <div class="divide-y divide-border">
        <div class="h-10 bg-secondary/50 animate-pulse rounded"></div>
        {#each Array(5) as _}
          <div class="flex gap-4 px-4 py-3">
            <div class="h-4 w-24 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-12 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-28 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-20 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Receipt #','Product','Qty','Supplier','Stock Value'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each purchases as p}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{p.receiptNumber}</td>
              <td class="px-4 py-3 text-foreground">{p.product?.drinkName ?? p.product}</td>
              <td class="px-4 py-3 text-foreground">{p.quantity}</td>
              <td class="px-4 py-3 text-muted-foreground">{p.supplier}</td>
              <td class="px-4 py-3 text-foreground">KES {p.stockValue?.toLocaleString() ?? '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
