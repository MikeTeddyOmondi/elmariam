<script lang="ts">
  import { createBooking, getCustomers } from '$lib/remote/hotel.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  const customers = getCustomers();

  let customerId = $state('');
  let numberAdults = $state(1);
  let numberKids = $state(0);
  let roomType = $state<'single' | 'double'>('single');
  let checkInDate = $state('');
  let checkOutDate = $state('');
  let paymentMethod = $state<'cash' | 'mpesa' | 'bank'>('cash');
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    try {
      await createBooking({ customerId, numberAdults, numberKids, roomType, checkInDate, checkOutDate, paymentMethod });
      toast.success('Booking created successfully.');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  }
</script>

<div class="space-y-6 max-w-lg">
  <div>
    <a href="/receptionist/bookings" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">New Booking</h1>
  </div>

  <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="customer">Customer</label>
      {#await customers}
        <select id="customer" disabled class="bg-background border border-input rounded-md px-3 py-2 text-sm text-muted-foreground"><option>Loading…</option></select>
      {:then data}
        <select id="customer" bind:value={customerId} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select customer</option>
          {#each data as c}
            <option value={c._id}>{c.firstname} {c.lastname} — {c.id_number}</option>
          {/each}
        </select>
      {/await}
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="adults">Adults</label>
        <input id="adults" type="number" bind:value={numberAdults} min="1" required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="kids">Kids</label>
        <input id="kids" type="number" bind:value={numberKids} min="0" required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="roomType">Room Type</label>
      <select id="roomType" bind:value={roomType} class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="single">Single</option>
        <option value="double">Double</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="checkin">Check In</label>
        <input id="checkin" type="date" bind:value={checkInDate} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="checkout">Check Out</label>
        <input id="checkout" type="date" bind:value={checkOutDate} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="payment">Payment Method</label>
      <select id="payment" bind:value={paymentMethod} class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="cash">Cash</option>
        <option value="mpesa">M-Pesa</option>
        <option value="bank">Bank</option>
      </select>
    </div>
    <Button type="submit" class="w-full">Create Booking</Button>
  </form>
</div>
