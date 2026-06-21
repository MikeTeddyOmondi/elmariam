<script lang="ts">
  import { getRoomTypes, createRoomType } from '$lib/remote/hotel.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let roomTypes: any[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => {
    getRoomTypes()
      .then(d => { roomTypes = d; loading = false; })
      .catch(e => { loadError = e.message; loading = false; });
  });

  let title       = $state('');
  let description = $state('');
  let rate        = $state(0);
  let capacity    = $state(1);
  let roomType    = $state<'single'|'double'>('single');
  let saving      = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    try {
      await createRoomType({ title, description, rate, capacity, roomType });
      toast.success('Room type added.');
      title = ''; description = ''; rate = 0; capacity = 1;
      getRoomTypes().then(d => { roomTypes = d; }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Room Types</h1>
    <p class="text-sm text-muted-foreground mt-1">Available room categories and rates</p>
  </div>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add Room Type</h2>
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="rttitle">Title</label>
        <input id="rttitle" bind:value={title} placeholder="e.g. Deluxe Single" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="rttype">Type</label>
        <select id="rttype" bind:value={roomType} required class={selectCls}>
          <option value="single">Single</option>
          <option value="double">Double</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="rtrate">Rate / Night (KES)</label>
        <input id="rtrate" type="number" min="0" step="0.01" bind:value={rate} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="rtcap">Capacity</label>
        <input id="rtcap" type="number" min="1" bind:value={capacity} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5 sm:col-span-2">
        <label class="text-xs text-muted-foreground" for="rtdesc">Description</label>
        <input id="rtdesc" bind:value={description} placeholder="Brief description…" required class={inputCls} />
      </div>
      <div class="sm:col-span-2 lg:col-span-3 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Room Type'}</Button>
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
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-16 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-24 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-12 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Title','Type','Rate (KES)','Capacity','Description'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each roomTypes as rt}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{rt.title}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{rt.roomType}</td>
              <td class="px-4 py-3 text-foreground">KES {rt.rate?.toLocaleString()}</td>
              <td class="px-4 py-3 text-foreground">{rt.capacity}</td>
              <td class="px-4 py-3 text-muted-foreground">{rt.description || '—'}</td>
            </tr>
          {:else}
            <tr><td colspan="5" class="px-4 py-6 text-center text-sm text-muted-foreground">No room types found</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
