<script lang="ts">
  import { createBarPurchase, getDrinks } from '$lib/remote/bar.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  const drinks = getDrinks();

  let receiptNumber = $state('');
  let product = $state('');
  let quantity = $state(1);
  let supplier = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    try {
      await createBarPurchase({ receiptNumber, product, quantity, supplier });
      toast.success('Purchase recorded.');
      receiptNumber = product = supplier = '';
      quantity = 1;
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  }

  const inputCls = 'bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full';
</script>

<div class="space-y-6 max-w-lg">
  <div>
    <a href="/barista/purchases" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">New Purchase</h1>
  </div>

  <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="receipt">Receipt #</label>
      <input id="receipt" bind:value={receiptNumber} required class={inputCls} />
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="product">Product</label>
      {#await drinks}
        <select id="product" disabled class={inputCls}><option>Loading…</option></select>
      {:then data}
        <select id="product" bind:value={product} required class={inputCls}>
          <option value="">Select drink</option>
          {#each data as d}
            <option value={d._id}>{d.drinkName} ({d.drinkCode})</option>
          {/each}
        </select>
      {/await}
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="qty">Quantity</label>
      <input id="qty" type="number" bind:value={quantity} min="1" required class={inputCls} />
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="supplier">Supplier</label>
      <input id="supplier" bind:value={supplier} required class={inputCls} />
    </div>
    <Button type="submit" class="w-full">Record Purchase</Button>
  </form>
</div>
