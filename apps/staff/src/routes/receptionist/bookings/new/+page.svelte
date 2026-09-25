<script lang="ts">
  import { createBooking, getCustomers } from '$lib/remote/hotel.remote';
  import { Button, Card, CardContent, Form, Input, Label, SelectField, toast, toastError } from '@elmariam/ui';
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

  const ROOM_TYPE_OPTIONS = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' }
  ];

  const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank', label: 'Bank Transfer' }
  ];

  const customerOptions = $derived(
    customers.map((c) => ({ value: c.id_number, label: `${c.firstname} ${c.lastname} (${c.id_number})` }))
  );
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
          <Form.Message issues={createBooking.fields.allIssues()} />
        </div>

        <Form.Field class="sm:col-span-2">
          <Label for="customer">Customer</Label>
          <!-- `createBooking` looks the customer up by ID number, not ObjectId. -->
          <SelectField
            id="customer"
            disabled={loading}
            items={customerOptions}
            placeholder={loading ? 'Loading' : 'Select customer'}
            {...createBooking.fields.customerId.as('select')}
          />
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
          <SelectField
            id="roomtype"
            items={ROOM_TYPE_OPTIONS}
            {...createBooking.fields.roomType.as('select', 'single')}
          />
          <Form.FieldErrors issues={createBooking.fields.roomType.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="pay">Payment Method</Label>
          <SelectField
            id="pay"
            items={PAYMENT_OPTIONS}
            {...createBooking.fields.paymentMethod.as('select', 'cash')}
          />
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
