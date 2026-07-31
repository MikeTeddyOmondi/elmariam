<script lang="ts">
  import { createBooking } from '$lib/remote/booking.remote';
  import { getRoomTypes } from '$lib/remote/catalog.remote';
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

<a href="/portal/bookings" class="text-sm text-muted-foreground hover:text-foreground">← Back</a>
<h1 class="mb-6 mt-4 text-2xl font-bold text-foreground">New Booking</h1>

<div class="flex flex-wrap items-start gap-8">
  <!--
    `{...createBooking.enhance(...)}` keeps the progressive-enhancement
    fallback: with JavaScript disabled the browser posts the form normally.
    The customer is resolved from the session server-side and is never sent.
  -->
  <form
    {...createBooking.enhance(async ({ submit }) => {
      try {
        // `submit()` resolves to false when the server returns validation
        // issues — it does not throw. Toasting unconditionally would report
        // success on an invalid form.
        const ok = await submit();
        if (ok) toast.success('Booking created.');
      } catch (e) {
        toastError(e);
      }
    })}
    class="flex min-w-[280px] flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-6"
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

  <aside class="min-w-56 rounded-xl border border-border bg-card p-6">
    <h3 class="mb-4 font-semibold text-card-foreground">Room Rates</h3>
    {#each roomTypes as rt}
      <div class="flex justify-between border-b border-border py-2 text-sm last:border-0">
        <strong class="text-foreground">{rt.title}</strong>
        <span class="text-muted-foreground">KES {rt.rate?.toLocaleString()} / night</span>
      </div>
    {:else}
      <p class="text-sm text-muted-foreground">Loading…</p>
    {/each}
  </aside>
</div>
