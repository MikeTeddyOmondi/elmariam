<script lang="ts">
  import { getRooms, getRoomTypes, createRoom } from '$lib/remote/hotel.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  const rooms = getRooms();
  const roomTypes = getRoomTypes();

  let number = $state('');
  let roomTypeId = $state('');
  let saving = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    try {
      await createRoom({ roomTypeId, number });
      toast.success('Room created.');
      number = ''; roomTypeId = '';
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Rooms</h1>
    <p class="text-sm text-muted-foreground mt-1">Manage individual hotel rooms</p>
  </div>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add Room</h2>
    <form onsubmit={submit} class="grid sm:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="number">Room Number</label>
        <input id="number" bind:value={number} placeholder="e.g. 101" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="rtype">Room Type</label>
        {#await roomTypes}
          <select disabled class={selectCls}><option>Loading…</option></select>
        {:then types}
          <select id="rtype" bind:value={roomTypeId} required class={selectCls}>
            <option value="">Select type</option>
            {#each types as t}<option value={t._id}>{t.title} ({t.roomType})</option>{/each}
          </select>
        {:catch}
          <select disabled class={selectCls}><option>Failed to load types</option></select>
        {/await}
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Room'}</Button>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await rooms}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Room</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each data as room}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{room.number}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  {room.isBooked ? 'bg-red-500/15 text-red-500' : 'bg-green-500/15 text-green-500'}">
                  {room.isBooked ? 'Booked' : 'Available'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
