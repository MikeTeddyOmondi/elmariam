<script lang="ts">
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8009';

  let drinkName = $state('');
  let drinkCode = $state('');
  let typeOfDrink = $state('');
  let uom = $state('bottles');
  let packageQty = $state(1);
  let buyingPrice = $state(0);
  let sellingPrice = $state(0);
  let file = $state<File | null>(null);

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    file = input.files?.[0] ?? null;
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const token = document.cookie.split('; ').find((c) => c.startsWith('access_token='))?.split('=')[1];
    if (!token) { toast.error('Not authenticated.'); return; }

    const fd = new FormData();
    fd.append('drinkName', drinkName);
    fd.append('drinkCode', drinkCode);
    fd.append('typeOfDrink', typeOfDrink);
    fd.append('uom', uom);
    fd.append('packageQty', String(packageQty));
    fd.append('buyingPrice', String(buyingPrice));
    fd.append('sellingPrice', String(sellingPrice));
    if (file) fd.append('image', file);

    try {
      const res = await fetch(`${GATEWAY_URL}/api/bar/drinks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.data?.message || 'API error');
      toast.success('Drink added successfully.');
      drinkName = drinkCode = typeOfDrink = '';
      uom = 'bottles'; packageQty = 1; buyingPrice = sellingPrice = 0; file = null;
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  }

  const inputCls = 'bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full';
</script>

<div class="space-y-6 max-w-lg">
  <div>
    <a href="/barista/drinks" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">Add Drink</h1>
  </div>

  <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="name">Drink Name</label>
        <input id="name" bind:value={drinkName} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="code">Drink Code</label>
        <input id="code" bind:value={drinkCode} required class={inputCls} />
      </div>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="type">Type</label>
      <input id="type" bind:value={typeOfDrink} required class={inputCls} />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="uom">UOM</label>
        <select id="uom" bind:value={uom} class={inputCls}>
          <option value="bottles">Bottles</option>
          <option value="crates">Crates</option>
          <option value="pack">Pack</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="pkgqty">Package Qty</label>
        <input id="pkgqty" type="number" bind:value={packageQty} min="1" required class={inputCls} />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="buy">Buying Price (KES)</label>
        <input id="buy" type="number" bind:value={buyingPrice} min="0" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="sell">Selling Price (KES)</label>
        <input id="sell" type="number" bind:value={sellingPrice} min="0" required class={inputCls} />
      </div>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="img">Image <span class="text-xs">(optional)</span></label>
      <input id="img" type="file" accept="image/*" onchange={onFileChange} class="text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-secondary file:text-sm file:text-foreground hover:file:bg-secondary/80 cursor-pointer" />
    </div>
    <Button type="submit" class="w-full">Add Drink</Button>
  </form>
</div>
