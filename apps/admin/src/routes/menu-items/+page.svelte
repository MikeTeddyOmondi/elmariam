<script lang="ts">
  import { getMenuItems, createMenuItem } from '$lib/remote/restaurant.remote';
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  const menuItems = getMenuItems();

  let name = $state('');
  let category = $state<'appetizer'|'main'|'dessert'|'beverage'|'side'>('main');
  let price = $state(0);
  let description = $state('');
  let isAvailable = $state(true);
  let saving = $state(false);
  let error = $state('');
  let success = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = ''; success = false; saving = true;
    try {
      await createMenuItem({ name, category, price, description: description || undefined, isAvailable });
      success = true; name = ''; price = 0; description = ''; isAvailable = true;
    } catch (err: any) {
      error = err.message;
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-foreground">Menu Items</h1>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add Menu Item</h2>
    {#if error}<Alert class="mb-3"><AlertDescription class="text-destructive">{error}</AlertDescription></Alert>{/if}
    {#if success}<Alert class="mb-3"><AlertDescription class="text-green-500">Menu item added.</AlertDescription></Alert>{/if}
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="mname">Name</label>
        <input id="mname" bind:value={name} placeholder="e.g. Grilled Chicken" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="cat">Category</label>
        <select id="cat" bind:value={category} required class={selectCls}>
          {#each ['appetizer','main','dessert','beverage','side'] as c}
            <option value={c}>{c}</option>
          {/each}
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="mprice">Price (KES)</label>
        <input id="mprice" type="number" min="0" step="0.01" bind:value={price} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5 sm:col-span-2">
        <label class="text-xs text-muted-foreground" for="desc">Description (optional)</label>
        <input id="desc" bind:value={description} placeholder="Short description…" class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="avail">Available</label>
        <select id="avail" bind:value={isAvailable} class={selectCls}>
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
      </div>
      <div class="sm:col-span-2 lg:col-span-3 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Item'}</Button>
      </div>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await menuItems}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Name','Category','Price (KES)','Available','Description'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as item}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{item.name}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{item.category}</td>
              <td class="px-4 py-3 text-foreground">{item.price?.toLocaleString()}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  {item.isAvailable ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}">
                  {item.isAvailable ? 'Yes' : 'No'}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{item.description || '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
