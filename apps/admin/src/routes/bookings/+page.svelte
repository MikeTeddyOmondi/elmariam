<script lang="ts">
  import { getBookings, createBooking, getCustomers } from '$lib/remote/hotel.remote';
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  const bookings  = getBookings();
  const customers = getCustomers();

  let customerId    = $state('');
  let numberAdults  = $state(1);
  let numberKids    = $state(0);
  let roomType      = $state<'single'|'double'>('single');
  let checkInDate   = $state('');
  let checkOutDate  = $state('');
  let paymentMethod = $state<'cash'|'mpesa'|'bank'>('cash');
  let saving        = $state(false);
  let error         = $state('');
  let success       = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = ''; success = false; saving = true;
    try {
      await createBooking({ customerId, numberAdults, numberKids, roomType, checkInDate, checkOutDate, paymentMethod });
      success = true; customerId = ''; numberAdults = 1; numberKids = 0; checkInDate = ''; checkOutDate = '';
    } catch (err: any) {
      error = err.message;
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const selectCls = `${inputCls} cursor-pointer`;
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bookings</h1>
    <p class="text-sm text-muted-foreground mt-1">All hotel bookings</p>
  </div>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">New Booking</h2>
    {#if error}<Alert class="mb-3"><AlertDescription class="text-destructive">{error}</AlertDescription></Alert>{/if}
    {#if success}<Alert class="mb-3"><AlertDescription class="text-green-500">Booking created.</AlertDescription></Alert>{/if}
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
        <label class="text-xs text-muted-foreground" for="bcust">Customer (ID Number)</label>
        {#await customers}
          <select disabled class={selectCls}><option>Loading…</option></select>
        {:then list}
          <select id="bcust" bind:value={customerId} required class={selectCls}>
            <option value="">Select customer</option>
            {#each list as c}<option value={c.id_number}>{c.firstname} {c.lastname} — {c.id_number}</option>{/each}
          </select>
        {:catch}
          <input bind:value={customerId} placeholder="Enter ID number" required class={inputCls} />
        {/await}
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="btype">Room Type</label>
        <select id="btype" bind:value={roomType} required class={selectCls}>
          <option value="single">Single</option>
          <option value="double">Double</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="bpay">Payment Method</label>
        <select id="bpay" bind:value={paymentMethod} required class={selectCls}>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="bank">Bank</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="bcin">Check In</label>
        <input id="bcin" type="date" bind:value={checkInDate} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="bcout">Check Out</label>
        <input id="bcout" type="date" bind:value={checkOutDate} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="badults">Adults</label>
        <input id="badults" type="number" min="1" bind:value={numberAdults} required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="bkids">Kids</label>
        <input id="bkids" type="number" min="0" bind:value={numberKids} class={inputCls} />
      </div>
      <div class="sm:col-span-2 lg:col-span-3 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Booking'}</Button>
      </div>
    </form>
  </div>

  <!-- List -->
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
