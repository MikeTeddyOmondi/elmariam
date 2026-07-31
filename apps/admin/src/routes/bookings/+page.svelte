<script lang="ts">
  import { getBookings, getCustomers, createBooking, type BookingView, type CustomerView } from '$lib/remote/hotel.remote';
  import {
    Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, Select, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError
  } from '@elmariam/ui';
  import CalendarPlus from 'lucide-svelte/icons/calendar-plus';

  let bookings: BookingView[] = $state([]);
  let customers: CustomerView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    Promise.all([getBookings(), getCustomers()])
      .then(([b, c]) => { bookings = b; customers = c; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Bookings</h1>
    <p class="mt-1 text-sm text-muted-foreground">Room reservations and stays</p>
  </div>

  <Card class="max-w-2xl">
    <CardHeader>
      <CardTitle class="text-base">Create Booking</CardTitle>
    </CardHeader>
    <CardContent>
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
          <Label for="bcustomer">Customer</Label>
          <!-- `createBooking` looks the customer up by ID number, not ObjectId. -->
          <Select id="bcustomer" disabled={loading} {...createBooking.fields.customerId.as('select')}>
            <option value="">{loading ? 'Loading…' : 'Select customer'}</option>
            {#each customers as c}
              <option value={c.id_number}>{c.firstname} {c.lastname} — {c.id_number}</option>
            {/each}
          </Select>
          <Form.FieldErrors issues={createBooking.fields.customerId.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="badults">Adults</Label>
          <Input id="badults" min="1" {...createBooking.fields.numberAdults.as('number')} />
          <Form.FieldErrors issues={createBooking.fields.numberAdults.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="bkids">Kids</Label>
          <Input id="bkids" min="0" {...createBooking.fields.numberKids.as('number')} />
          <Form.FieldErrors issues={createBooking.fields.numberKids.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="broomtype">Room Type</Label>
          <Select id="broomtype" {...createBooking.fields.roomType.as('select', 'single')}>
            <option value="single">Single</option>
            <option value="double">Double</option>
          </Select>
          <Form.FieldErrors issues={createBooking.fields.roomType.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="bpay">Payment Method</Label>
          <Select id="bpay" {...createBooking.fields.paymentMethod.as('select', 'cash')}>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank Transfer</option>
          </Select>
          <Form.FieldErrors issues={createBooking.fields.paymentMethod.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="bcheckin">Check In</Label>
          <Input id="bcheckin" {...createBooking.fields.checkInDate.as('date')} />
          <Form.FieldErrors issues={createBooking.fields.checkInDate.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="bcheckout">Check Out</Label>
          <Input id="bcheckout" {...createBooking.fields.checkOutDate.as('date')} />
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

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
    {:else if loadError}
      <CardContent class="py-6 text-sm text-destructive">{loadError}</CardContent>
    {:else}
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead class="text-right">Adults</TableHead>
              <TableHead class="text-right">Kids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each bookings as b}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{b.id}</TableCell>
                <TableCell class="text-foreground">
                  {b.customer?.firstname ?? '—'} {b.customer?.lastname ?? ''}
                </TableCell>
                <TableCell class="capitalize text-muted-foreground">
                  {b.roomType?.roomType ?? b.roomType ?? '—'}
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell class="text-right text-foreground">{b.numberAdults ?? 0}</TableCell>
                <TableCell class="text-right text-foreground">{b.numberKids ?? 0}</TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={7} class="py-6 text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </Card>
</div>
