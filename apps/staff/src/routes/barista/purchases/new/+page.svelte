<script lang="ts">
  import { createBarPurchase, getDrinks } from '$lib/remote/bar.remote';
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  const drinks = getDrinks();

  let receiptNumber = $state('');
  let product = $state('');
  let quantity = $state(1);
  let supplier = $state('');
  let error = $state('');
  let success = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    try {
      await createBarPurchase({ receiptNumber, product, quantity, supplier });
      success = 'Purchase recorded.';
      receiptNumber = product = supplier = '';
      quantity = 1;
    } catch (err: any) {
      error = err.message;
    }
  }

  const inputCls = 'bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full';
</script>

<div class="space-y-6 max-w-lg">
  <div>
    <a href="/barista/purchases" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">New Purchase</h1>
  </div>

  {#if success}
    <Alert><AlertDescription class="text-green-400">{success}</AlertDescription></Alert>
  {/if}
  {#if error}
    <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
  {/if}

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
