<script lang="ts">
  import { createOrder, getMenuItems } from '$lib/remote/restaurant.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let menuItems = $state<Awaited<ReturnType<typeof getMenuItems>>>([] as never);

  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them

  // eagerly fetches during SSR and the result is not hydratable.

  $effect(() => {

    getMenuItems()

      .then((d) => { menuItems = d; loading = false; })

      .catch(() => { loading = false; });

  });
  type LineItem = { menuItemId: string; quantity: number };
  let items = $state<LineItem[]>([{ menuItemId: '', quantity: 1 }]);
  let tableNumber = $state<number | undefined>(undefined);
  let paymentMethod = $state<'cash' | 'mpesa' | 'bank'>('cash');
  function addItem() { items = [...items, { menuItemId: '', quantity: 1 }]; }
  function removeItem(i: number) { items = items.filter((_, idx) => idx !== i); }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const valid = items.filter((it) => it.menuItemId && it.quantity > 0);
    if (!valid.length) { toast.error('Add at least one item.'); return; }
    try {
      await createOrder({ items: valid, tableNumber, paymentMethod });
      toast.success('Order created.');
      items = [{ menuItemId: '', quantity: 1 }];
      tableNumber = undefined;
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  }

  const selectCls = 'flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const inputCls = 'bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full';
</script>

<div class="space-y-6 max-w-xl">
  <div>
    <a href="/waiter/orders" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">New Order</h1>
  </div>

  <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="table">Table # <span class="text-xs">(optional)</span></label>
      <input id="table" type="number" bind:value={tableNumber} min="1" class="w-32 {inputCls}" />
    </div>

          {#each items as item, i}
        <div class="flex gap-2 items-center">
          <select bind:value={item.menuItemId} required class={selectCls}>
            <option value="">Select item</option>
            {#each menuItems.filter((m: any) => m.isAvailable) as m}
              <option value={m._id}>{m.name} — KES {m.price?.toLocaleString()}</option>
            {/each}
          </select>
          <input type="number" bind:value={item.quantity} min="1" placeholder="Qty" required class="w-20 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <button type="button" onclick={() => removeItem(i)}
            class="px-2 py-2 rounded-md text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">✕</button>
        </div>
      {/each}


    <button type="button" onclick={addItem}
      class="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 transition-colors">
      + Add Item
    </button>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="pay">Payment Method</label>
      <select id="pay" bind:value={paymentMethod} class={inputCls}>
        <option value="cash">Cash</option>
        <option value="mpesa">M-Pesa</option>
        <option value="bank">Bank</option>
      </select>
    </div>

    <Button type="submit" class="w-full">Place Order</Button>
  </form>
</div>
