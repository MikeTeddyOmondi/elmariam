<script lang="ts">
  import { createBooking, getCustomers } from '$lib/remote/hotel.remote';
  import { Button, Card, CardContent, Form, Input, Label, Select, toast, toastError } from '@elmariam/ui';
  import CalendarPlus from 'lucide-svelte/icons/calendar-plus';

  let customers = $state<Awaited<ReturnType<typeof getCustomers>>>([] as never);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getCustomers()
      .then((d) => { customers = d; loading = false; })
      .catch(() => { loading = false; });
  });
</script>

<div class="max-w-lg space-y-6">
  <div>
    <a href="/receptionist/bookings" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
      ← Back
    </a>
    <h1 class="mt-2 text-2xl font-bold text-foreground">New Booking</h1>
  </div>

  <Card>
    <CardContent class="py-6">
      <form
        {...createBooking.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) toast.success('Booking created.');
          } catch (e) {
            toastError(e);
          }
        })}
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="sm:col-span-2 empty:hidden">
          <Form.Message issues={createBooking.fields.issues?.()} />
        </div>

        <Form.Field class="sm:col-span-2">
          <Label for="customer">Customer</Label>
          <!-- `createBooking` looks the customer up by ID number, not ObjectId. -->
          <Select id="customer" disabled={loading} {...createBooking.fields.customerId.as('select')}>
            <option value="">{loading ? 'Loading…' : 'Select customer'}</option>
            {#each customers as c}
              <option value={c.id_number}>{c.firstname} {c.lastname} — {c.id_number}</option>
            {/each}
          </Select>
          <Form.FieldErrors issues={createBooking.fields.customerId.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="adults">Adults</Label>
          <Input id="adults" min="1" {...createBooking.fields.numberAdults.as('number')} />
          <Form.FieldErrors issues={createBooking.fields.numberAdults.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="kids">Kids</Label>
          <Input id="kids" min="0" {...createBooking.fields.numberKids.as('number')} />
          <Form.FieldErrors issues={createBooking.fields.numberKids.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="roomtype">Room Type</Label>
          <Select id="roomtype" {...createBooking.fields.roomType.as('select', 'single')}>
            <option value="single">Single</option>
            <option value="double">Double</option>
          </Select>
          <Form.FieldErrors issues={createBooking.fields.roomType.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="pay">Payment Method</Label>
          <Select id="pay" {...createBooking.fields.paymentMethod.as('select', 'cash')}>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank Transfer</option>
          </Select>
          <Form.FieldErrors issues={createBooking.fields.paymentMethod.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="checkin">Check In</Label>
          <Input id="checkin" {...createBooking.fields.checkInDate.as('date')} />
          <Form.FieldErrors issues={createBooking.fields.checkInDate.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="checkout">Check Out</Label>
          <Input id="checkout" {...createBooking.fields.checkOutDate.as('date')} />
          <Form.FieldErrors issues={createBooking.fields.checkOutDate.issues()} />
        </Form.Field>

        <div class="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={createBooking.pending > 0}>
            <CalendarPlus />
            {createBooking.pending > 0 ? 'Saving…' : 'Create Booking'}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
