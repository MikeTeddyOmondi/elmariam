<script lang="ts">
  import { createBooking, getCustomers } from '$lib/remote/hotel.remote';

  const customers = getCustomers();

  let customerId = $state('');
  let numberAdults = $state(1);
  let numberKids = $state(0);
  let roomType = $state<'single' | 'double'>('single');
  let checkInDate = $state('');
  let checkOutDate = $state('');
  let paymentMethod = $state<'cash' | 'mpesa' | 'bank'>('cash');
  let error = $state('');
  let success = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    success = '';
    try {
      await createBooking({ customerId, numberAdults, numberKids, roomType, checkInDate, checkOutDate, paymentMethod });
      success = 'Booking created successfully.';
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<a href="/receptionist/bookings" class="back">← Back</a>
<h1>New Booking</h1>

{#if success}<p class="success">{success}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<form onsubmit={submit} class="form">
  <label>
    Customer
    {#await customers}
      <select disabled><option>Loading…</option></select>
    {:then data}
      <select bind:value={customerId} required>
        <option value="">Select customer</option>
        {#each data as c}
          <option value={c._id}>{c.firstname} {c.lastname} — {c.id_number}</option>
        {/each}
      </select>
    {/await}
  </label>
  <label>Adults <input type="number" bind:value={numberAdults} min="1" required /></label>
  <label>Kids <input type="number" bind:value={numberKids} min="0" required /></label>
  <label>
    Room Type
    <select bind:value={roomType}>
      <option value="single">Single</option>
      <option value="double">Double</option>
    </select>
  </label>
  <label>Check In <input type="date" bind:value={checkInDate} required /></label>
  <label>Check Out <input type="date" bind:value={checkOutDate} required /></label>
  <label>
    Payment Method
    <select bind:value={paymentMethod}>
      <option value="cash">Cash</option>
      <option value="mpesa">M-Pesa</option>
      <option value="bank">Bank</option>
    </select>
  </label>
  <button type="submit">Create Booking</button>
</form>

<style>
  .back { color: #0f3460; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); max-width: 480px; display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: #555; }
  input, select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  button { background: #0f3460; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .success { color: #27ae60; }
  .error { color: red; }
</style>
