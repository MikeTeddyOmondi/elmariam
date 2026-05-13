<script lang="ts">
  import { getRooms, getRoomTypes } from '$lib/remote/hotel.remote';
  import { Alert, AlertDescription } from '@elmariam/ui';

  const rooms = getRooms();
  const roomTypes = getRoomTypes();
</script>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Rooms</h1>
    <p class="text-sm text-muted-foreground mt-1">Room status and type configuration</p>
  </div>

  <section class="space-y-3">
    <h2 class="text-base font-semibold text-foreground">All Rooms</h2>
    {#await rooms}
      <p class="text-sm text-muted-foreground">Loading…</p>
    {:then data}
      <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
        <table class="w-full text-sm">
          <thead class="bg-secondary/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Room #</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each data as room}
              <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
                <td class="px-4 py-3 text-foreground font-medium">{room.number}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                    {room.isBooked ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'}">
                    {room.isBooked ? 'Booked' : 'Available'}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:catch err}
      <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
    {/await}
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-semibold text-foreground">Room Types</h2>
    {#await roomTypes}
      <p class="text-sm text-muted-foreground">Loading…</p>
    {:then data}
      <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
        <table class="w-full text-sm">
          <thead class="bg-secondary/50">
            <tr>
              {#each ['Title','Type','Rate','Capacity'] as h}
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each data as rt}
              <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
                <td class="px-4 py-3 text-foreground font-medium">{rt.title}</td>
                <td class="px-4 py-3 text-muted-foreground capitalize">{rt.roomType}</td>
                <td class="px-4 py-3 text-muted-foreground">KES {rt.rate?.toLocaleString()}</td>
                <td class="px-4 py-3 text-muted-foreground">{rt.capacity}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:catch err}
      <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
    {/await}
  </section>
</div>
