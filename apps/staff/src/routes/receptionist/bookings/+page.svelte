<script lang="ts">
  import { getBookings, initiateMpesaPayment, sendSmsNotification } from '$lib/remote/hotel.remote';

  const bookings = getBookings();

  let actionMsg = $state('');

  async function triggerMpesa(bookingId: string) {
    try {
      await initiateMpesaPayment({ bookingId });
      actionMsg = 'M-Pesa STK push initiated.';
    } catch (err: any) {
      actionMsg = err.message;
    }
  }

  async function triggerSms(bookingId: string) {
    try {
      await sendSmsNotification({ bookingId });
      actionMsg = 'SMS notification sent.';
    } catch (err: any) {
      actionMsg = err.message;
    }
  }
</script>

<div class="header">
  <h1>Bookings</h1>
  <a href="/receptionist/bookings/new" class="btn">+ New Booking</a>
</div>

{#if actionMsg}<p class="msg">{actionMsg}</p>{/if}

{#await bookings}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr><th>Customer</th><th>Room Type</th><th>Check In</th><th>Check Out</th><th>Adults</th><th>Kids</th><th>Actions</th></tr>
    </thead>
    <tbody>
      {#each data as b}
        <tr>
          <td>{b.customer?.firstname ?? '-'} {b.customer?.lastname ?? ''}</td>
          <td>{b.roomType}</td>
          <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
          <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
          <td>{b.numberAdults}</td>
          <td>{b.numberKids}</td>
          <td class="actions">
            <button onclick={() => triggerMpesa(b._id)}>M-Pesa</button>
            <button onclick={() => triggerSms(b._id)}>SMS</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  h1 { margin: 0; }
  .btn { background: #0f3460; color: #fff; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .actions { display: flex; gap: 0.5rem; }
  button { padding: 0.3rem 0.6rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; background: #0f3460; color: #fff; }
  .msg { color: #27ae60; }
  .error { color: red; }
</style>
