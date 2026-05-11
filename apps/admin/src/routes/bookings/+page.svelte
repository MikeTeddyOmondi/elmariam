<script lang="ts">
  import { getBookings } from '$lib/remote/hotel.remote';

  const bookings = getBookings();
</script>

<h1>Bookings</h1>

{#await bookings}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Booking ID</th>
        <th>Customer</th>
        <th>Room Type</th>
        <th>Check In</th>
        <th>Check Out</th>
        <th>Adults</th>
        <th>Kids</th>
      </tr>
    </thead>
    <tbody>
      {#each data as b}
        <tr>
          <td>{b._id}</td>
          <td>{b.customer?.firstname ?? '-'} {b.customer?.lastname ?? ''}</td>
          <td>{b.roomType}</td>
          <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
          <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
          <td>{b.numberAdults}</td>
          <td>{b.numberKids}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  h1 { margin: 0 0 1.5rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .error { color: red; }
</style>
