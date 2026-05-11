<script lang="ts">
  import { getMyBookings, getMyInvoices } from '$lib/remote/booking.remote';

  const bookings = getMyBookings();
  const invoices = getMyInvoices();
</script>

<h1>Welcome Back</h1>

<div class="grid">
  {#await bookings then data}
    <div class="card">
      <h3>Bookings</h3>
      <p class="number">{Array.isArray(data) ? data.length : 0}</p>
      <a href="/portal/bookings">View all →</a>
    </div>
  {/await}
  {#await invoices then data}
    <div class="card">
      <h3>Invoices</h3>
      <p class="number">{Array.isArray(data) ? data.length : 0}</p>
      <a href="/portal/invoices">View all →</a>
    </div>
  {/await}
  <div class="card cta">
    <h3>New Booking</h3>
    <p>Book a room for your next stay.</p>
    <a href="/portal/bookings/new" class="btn">Book Now</a>
  </div>
</div>

<style>
  h1 { margin: 0 0 1.5rem; color: #1a1a2e; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
  .card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  h3 { margin: 0 0 0.5rem; font-size: 0.9rem; text-transform: uppercase; color: #666; }
  .number { font-size: 2rem; font-weight: 700; color: #1a1a2e; margin: 0 0 0.5rem; }
  .card a { color: #c0392b; font-size: 0.9rem; }
  .cta p { color: #666; font-size: 0.9rem; margin: 0 0 1rem; }
  .btn { background: #1a1a2e; color: #fff; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.9rem; display: inline-block; }
</style>
