<script lang="ts">
  import { getBookings } from '$lib/remote/hotel.remote';

  const bookings = getBookings();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bookings</h1>
    <p class="text-sm text-muted-foreground mt-1">All hotel bookings</p>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#await bookings}
      <div class="p-6 text-sm text-muted-foreground">Loading…</div>
    {:then data}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Booking ID','Customer','Room Type','Check In','Check Out','Adults','Kids'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as b}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{b._id}</td>
              <td class="px-4 py-3 text-foreground">{b.customer?.firstname ?? '—'} {b.customer?.lastname ?? ''}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{b.roomType?.roomType ?? b.roomType ?? '—'}</td>
              <td class="px-4 py-3 text-muted-foreground">{b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '—'}</td>
              <td class="px-4 py-3 text-muted-foreground">{b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : '—'}</td>
              <td class="px-4 py-3 text-foreground">{b.numberAdults ?? 0}</td>
              <td class="px-4 py-3 text-foreground">{b.numberKids ?? 0}</td>
            </tr>
          {:else}
            <tr><td colspan="7" class="px-4 py-6 text-center text-sm text-muted-foreground">No bookings found</td></tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <div class="p-6 text-sm text-destructive">{err.message}</div>
    {/await}
  </div>
</div>
