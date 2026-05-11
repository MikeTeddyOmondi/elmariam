<script lang="ts">
  import { page } from '$app/stores';
  import { getOneBooking } from '$lib/remote/booking.remote';

  const bookingId = $derived($page.params.id);
  const booking = $derived(getOneBooking(bookingId));
</script>

<a href="/portal/bookings" class="back">← Back to Bookings</a>

{#await booking}
  <p>Loading…</p>
{:then b}
  <h1>Booking Details</h1>
  <div class="card">
    <div class="row"><span>Room Type</span><strong>{b.roomType}</strong></div>
    <div class="row"><span>Check In</span><strong>{new Date(b.checkInDate).toLocaleDateString()}</strong></div>
    <div class="row"><span>Check Out</span><strong>{new Date(b.checkOutDate).toLocaleDateString()}</strong></div>
    <div class="row"><span>Adults</span><strong>{b.numberAdults}</strong></div>
    <div class="row"><span>Kids</span><strong>{b.numberKids}</strong></div>
    {#if b.invoice}
      <div class="row"><span>Invoice Status</span><strong class:paid={b.invoice.status === 'paid'} class:pending={b.invoice.status === 'pending'}>{b.invoice.status}</strong></div>
      <div class="row"><span>Total (KES)</span><strong>{b.invoice.totalCost?.toLocaleString()}</strong></div>
    {/if}
  </div>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  .back { color: #1a1a2e; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; color: #1a1a2e; }
  .card { background: #fff; border-radius: 8px; padding: 1.75rem; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 480px; }
  .row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #eee; font-size: 0.95rem; color: #555; }
  .row:last-child { border-bottom: none; }
  .row strong { color: #1a1a2e; }
  .paid { color: #27ae60 !important; }
  .pending { color: #f39c12 !important; }
  .error { color: red; }
</style>
