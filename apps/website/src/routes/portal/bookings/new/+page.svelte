<script lang="ts">
  import { createBooking, getRoomTypes } from '$lib/remote/booking.remote';
  import { getMyProfile } from '$lib/remote/account.remote';
  import { toast } from 'svelte-sonner';

  const roomTypes = getRoomTypes();
  const profile = getMyProfile();

  let numberAdults = $state(1);
  let numberKids = $state(0);
  let roomType = $state<'single' | 'double'>('single');
  let checkInDate = $state('');
  let checkOutDate = $state('');
  let paymentMethod = $state<'cash' | 'mpesa' | 'bank'>('cash');
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    try {
      const p = await profile;
      await createBooking({
        customerId: p._id,
        numberAdults,
        numberKids,
        roomType,
        checkInDate,
        checkOutDate,
        paymentMethod,
      });
      toast.success('Booking created! Check your bookings for details.');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  }
</script>

<a href="/portal/bookings" class="back">← Back</a>
<h1>New Booking</h1>

<div class="layout">
  <form onsubmit={submit} class="form">
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
        <option value="bank">Bank Transfer</option>
      </select>
    </label>
    <button type="submit">Book Now</button>
  </form>

  <aside>
    <h3>Room Rates</h3>
    {#await roomTypes}
      <p>Loading…</p>
    {:then data}
      {#each data as rt}
        <div class="rate-card">
          <strong>{rt.title}</strong>
          <span>KES {rt.rate?.toLocaleString()} / night</span>
        </div>
      {/each}
    {/await}
  </aside>
</div>

<style>
  .back { color: #1a1a2e; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; color: #1a1a2e; }
  .layout { display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: #555; }
  input, select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  button { background: #1a1a2e; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  aside { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); min-width: 220px; }
  h3 { margin: 0 0 1rem; color: #1a1a2e; }
  .rate-card { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
</style>
