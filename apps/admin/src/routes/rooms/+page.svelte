<script lang="ts">
  import { getRooms, getRoomTypes, createRoom, type RoomView, type RoomTypeView } from '$lib/remote/hotel.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let rooms: RoomView[] = $state([]);
  let roomsLoading = $state(true);
  let roomsError = $state('');

  let roomTypes: RoomTypeView[] = $state([]);
  let roomTypesLoading = $state(true);

  $effect(() => {
    getRooms()
      .then(d => { rooms = d; roomsLoading = false; })
      .catch(e => { roomsError = e.message; roomsLoading = false; });
    getRoomTypes()
      .then(d => { roomTypes = d; roomTypesLoading = false; })
      .catch(() => { roomTypesLoading = false; });
  });

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
      getRooms().then(d => { rooms = d; }).catch(() => {});
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
        {#if roomTypesLoading}
          <select disabled class={selectCls}><option>Loading…</option></select>
        {:else}
          <select id="rtype" bind:value={roomTypeId} required class={selectCls}>
            <option value="">Select type</option>
            {#each roomTypes as t}<option value={t.id}>{t.title} ({t.roomType})</option>{/each}
          </select>
        {/if}
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Room'}</Button>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if roomsLoading}
      <div class="divide-y divide-border">
        <div class="h-10 bg-secondary/50 animate-pulse rounded"></div>
        {#each Array(5) as _}
          <div class="flex gap-4 px-4 py-3">
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-20 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if roomsError}
      <div class="p-6 text-sm text-destructive">{roomsError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Room</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each rooms as room}
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
    {/if}
  </div>
</div>
