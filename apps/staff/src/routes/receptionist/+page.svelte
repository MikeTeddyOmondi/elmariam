<script lang="ts">
  import { getBookings, getCustomers, getRooms, getInvoices } from '$lib/remote/hotel.remote';

  const bookings = getBookings();
  const customers = getCustomers();
  const rooms = getRooms();
  const invoices = getInvoices();
</script>

<h1>Dashboard</h1>

<div class="grid">
  {#await customers then data}
    <div class="card"><h3>Customers</h3><p class="number">{data.length}</p></div>
  {/await}
  {#await bookings then data}
    <div class="card"><h3>Bookings</h3><p class="number">{data.length}</p></div>
  {/await}
  {#await rooms then data}
    <div class="card"><h3>Available Rooms</h3><p class="number">{data.filter((r: any) => !r.isBooked).length}</p></div>
  {/await}
  {#await invoices then data}
    <div class="card"><h3>Invoices</h3><p class="number">{data.length}</p></div>
  {/await}
</div>

<style>
  h1 { margin: 0 0 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
  .card { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  h3 { margin: 0 0 0.5rem; font-size: 0.85rem; color: #666; text-transform: uppercase; }
  .number { margin: 0; font-size: 2rem; font-weight: 700; color: #0f3460; }
</style>
