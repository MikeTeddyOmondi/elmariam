<script lang="ts">
  import { getMyBookings } from '$lib/remote/booking.remote';

  const bookings = getMyBookings();
</script>

<div class="header">
  <h1>My Bookings</h1>
  <a href="/portal/bookings/new" class="btn">+ New Booking</a>
</div>

{#await bookings}
  <p>Loading…</p>
{:then data}
  {#if data.length === 0}
    <p class="empty">No bookings yet. <a href="/portal/bookings/new">Book a room</a>.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Room Type</th><th>Check In</th><th>Check Out</th><th>Adults</th><th>Kids</th><th>Details</th></tr>
      </thead>
      <tbody>
        {#each data as b}
          <tr>
            <td>{b.roomType}</td>
            <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
            <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
            <td>{b.numberAdults}</td>
            <td>{b.numberKids}</td>
            <td><a href="/portal/bookings/{b._id}">View →</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  h1 { margin: 0; color: #1a1a2e; }
  .btn { background: #1a1a2e; color: #fff; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  td a { color: #c0392b; }
  .empty { color: #999; }
  .error { color: red; }
</style>
