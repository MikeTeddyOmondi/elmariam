<script lang="ts">
  import { createBooking, getRoomTypes } from '$lib/remote/booking.remote';
  import { Button, Form, Input, Label, Select, toast, toastError } from '@elmariam/ui';

  type RoomType = Awaited<ReturnType<typeof getRoomTypes>>[number];

  let roomTypes = $state<RoomType[]>([]);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getRoomTypes()
      .then((d) => { roomTypes = d; })
      .catch(() => { roomTypes = []; });
  });
</script>

<a href="/portal/bookings" class="back">← Back</a>
<h1>New Booking</h1>

<div class="layout">
  <!--
    `{...createBooking.enhance(...)}` keeps the progressive-enhancement
    fallback: with JavaScript disabled the browser posts the form normally.
    The customer is resolved from the session server-side and is never sent.
  -->
  <form
    {...createBooking.enhance(async ({ submit }) => {
      try {
        await submit();
        toast.success('Booking created.');
      } catch (e) {
        toastError(e);
      }
    })}
    class="form"
  >
    <Form.Message issues={createBooking.fields.allIssues?.()} />

    <Form.Field>
      <Label for="numberAdults">Adults</Label>
      <Input id="numberAdults" min="1" {...createBooking.fields.numberAdults.as('number')} />
      <Form.FieldErrors issues={createBooking.fields.numberAdults.issues()} />
    </Form.Field>

    <Form.Field>
      <Label for="numberKids">Kids</Label>
      <Input id="numberKids" min="0" {...createBooking.fields.numberKids.as('number')} />
      <Form.FieldErrors issues={createBooking.fields.numberKids.issues()} />
    </Form.Field>

    <Form.Field>
      <Label for="roomType">Room Type</Label>
      <Select id="roomType" {...createBooking.fields.roomType.as('select')}>
        <option value="single">Single</option>
        <option value="double">Double</option>
      </Select>
      <Form.FieldErrors issues={createBooking.fields.roomType.issues()} />
    </Form.Field>

    <Form.Field>
      <Label for="checkInDate">Check In</Label>
      <Input id="checkInDate" {...createBooking.fields.checkInDate.as('date')} />
      <Form.FieldErrors issues={createBooking.fields.checkInDate.issues()} />
    </Form.Field>

    <Form.Field>
      <Label for="checkOutDate">Check Out</Label>
      <Input id="checkOutDate" {...createBooking.fields.checkOutDate.as('date')} />
      <Form.FieldErrors issues={createBooking.fields.checkOutDate.issues()} />
    </Form.Field>

    <Form.Field>
      <Label for="paymentMethod">Payment Method</Label>
      <Select id="paymentMethod" {...createBooking.fields.paymentMethod.as('select')}>
        <option value="cash">Cash</option>
        <option value="mpesa">M-Pesa</option>
        <option value="bank">Bank Transfer</option>
      </Select>
      <Form.FieldErrors issues={createBooking.fields.paymentMethod.issues()} />
    </Form.Field>

    <Button type="submit" disabled={createBooking.pending > 0}>
      {createBooking.pending > 0 ? 'Booking…' : 'Book Now'}
    </Button>
  </form>

  <aside>
    <h3>Room Rates</h3>
    {#each roomTypes as rt}
      <div class="rate-card">
        <strong>{rt.title}</strong>
        <span>KES {rt.rate?.toLocaleString()} / night</span>
      </div>
    {:else}
      <p class="muted">Loading…</p>
    {/each}
  </aside>
</div>

<style>
  .back { color: #1a1a2e; text-decoration: none; font-size: 0.9rem; }
  h1 { margin: 1rem 0 1.5rem; color: #1a1a2e; }
  .layout { display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; }
  .form { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 1rem; }
  aside { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); min-width: 220px; }
  h3 { margin: 0 0 1rem; color: #1a1a2e; }
  .rate-card { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  .muted { color: #999; font-size: 0.9rem; }
</style>
