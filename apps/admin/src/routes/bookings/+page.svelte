<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getBookings, getCustomers, getInvoices, createBooking, initiateMpesaPayment, sendSmsNotification, type BookingView, type CustomerView } from '$lib/remote/hotel.remote';
  import {
    Button, Card, CardContent, Dialog, Form, Input, Label, SelectField, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    ReceiptDialog, type ReceiptData,
    toast, toastError
  } from '@elmariam/ui';
  import CalendarPlus from 'lucide-svelte/icons/calendar-plus';
  import Printer from 'lucide-svelte/icons/printer';
  import Smartphone from 'lucide-svelte/icons/smartphone';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import { can } from '$lib/permissions';

  let bookings: BookingView[] = $state([]);
  let customers: CustomerView[] = $state([]);
  // Invoices carry the money; a booking receipt joins to its invoice by bookingRef.
  let invoices = $state<Awaited<ReturnType<typeof getInvoices>>>([] as never);
  let loading = $state(true);

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Receipt preview (after a create, and re-openable from any row).
  let receipt = $state<ReceiptData | null>(null);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    Promise.all([getBookings(), getCustomers(), getInvoices()])
      .then(([b, c, i]) => { bookings = b; customers = c; invoices = i; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  function receiptForBooking(b: BookingView): ReceiptData {
    const inv = (invoices as any[]).find((i) => String(i.bookingRef) === b.id);
    const meta = [
      { label: 'Guest', value: `${b.customer?.firstname ?? ''} ${b.customer?.lastname ?? ''}`.trim() || '-' },
      { label: 'Room', value: b.room?.number ?? '-' },
      { label: 'Room type', value: String(b.roomType?.roomType ?? '-') },
      { label: 'Check in', value: b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-' },
      { label: 'Check out', value: b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : '-' },
      { label: 'Guests', value: `${b.numberAdults ?? 0} adult(s), ${b.numberKids ?? 0} kid(s)` },
    ];
    if (inv?.paymentMethod) meta.push({ label: 'Payment', value: String(inv.paymentMethod) });
    const totals = inv
      ? [
          { label: 'Subtotal', amount: inv.subTotalCost ?? 0 },
          { label: 'VAT (14%)', amount: inv.vat ?? 0 },
          { label: 'Levy (2%)', amount: inv.levy ?? 0 },
          { label: 'Total', amount: inv.totalCost ?? 0, strong: true },
        ]
      : [];
    return {
      subtitle: 'Booking Receipt',
      reference: b.id,
      date: b.createdAt ? new Date(b.createdAt) : new Date(),
      meta,
      totals,
    };
  }

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

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('bookings:write'));

  async function triggerMpesa(bookingId: string) {
    try {
      await initiateMpesaPayment({ bookingId });
      toast.success('M-Pesa STK push initiated.');
    } catch (err) {
      toastError(err);
    }
  }

  async function triggerSms(bookingId: string) {
    try {
      await sendSmsNotification({ bookingId });
      toast.success('SMS notification sent.');
    } catch (err) {
      toastError(err);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Bookings</h1>
      <p class="mt-1 text-sm text-muted-foreground">Room reservations and stays</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <CalendarPlus />
        Create Booking
      </Button>
    {/if}
  </div>

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
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
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each bookings.slice((__page - 1) * __perPage, __page * __perPage) as b}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{b.id}</TableCell>
                <TableCell class="text-foreground">
                  {b.customer?.firstname ?? '-'} {b.customer?.lastname ?? ''}
                </TableCell>
                <TableCell class="capitalize text-muted-foreground">
                  {b.roomType?.roomType ?? b.roomType ?? '-'}
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell class="text-muted-foreground">
                  {b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell class="text-right text-foreground">{b.numberAdults ?? 0}</TableCell>
                <TableCell class="text-right text-foreground">{b.numberKids ?? 0}</TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    {#if canWrite}
                      <Button variant="outline" class="h-7 px-2 text-xs" onclick={() => triggerMpesa(b.id)}>
                        <Smartphone class="size-3" />
                        M-Pesa
                      </Button>
                      <Button variant="outline" class="h-7 px-2 text-xs" onclick={() => triggerSms(b.id)}>
                        <MessageSquare class="size-3" />
                        SMS
                      </Button>
                    {/if}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Print receipt for booking {b.id}"
                      title="Print receipt"
                      onclick={() => (receipt = receiptForBooking(b))}
                    >
                      <Printer />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={8} class="py-6 text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={bookings.length} perPage={__perPage} label="bookings" />
      </div>
      </div>
    {/if}
  </Card>
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="Create Booking"
    description="Reserve a room for a registered customer."
    pending={createBooking.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <form
      {...createBooking.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Booking created.');
            showCreate = false;
            // Refresh the table + invoices, then preview the newest booking's
            // receipt. `.run()` executes the query imperatively (the loader
            // above owns the reactive context). Newest is first (sorted desc).
            [bookings, invoices] = await Promise.all([getBookings().run(), getInvoices().run()]);
            if (bookings[0]) receipt = receiptForBooking(bookings[0]);
          }
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
        <Label for="bcustomer">Customer</Label>
        <!-- `createBooking` looks the customer up by ID number, not ObjectId. -->
        <SelectField
          id="bcustomer"
          disabled={loading}
          items={customerOptions}
          placeholder={loading ? 'Loading' : 'Select customer'}
          {...createBooking.fields.customerId.as('select')}
        />
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
        <SelectField
          id="broomtype"
          items={ROOM_TYPE_OPTIONS}
          {...createBooking.fields.roomType.as('select', 'single')}
        />
        <Form.FieldErrors issues={createBooking.fields.roomType.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="bpay">Payment Method</Label>
        <SelectField
          id="bpay"
          items={PAYMENT_OPTIONS}
          {...createBooking.fields.paymentMethod.as('select', 'cash')}
        />
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

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={createBooking.pending > 0}
          onclick={() => (showCreate = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createBooking.pending > 0}>
          <CalendarPlus />
          {createBooking.pending > 0 ? 'Saving…' : 'Create Booking'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

<ReceiptDialog
  open={receipt !== null}
  data={receipt}
  title="Booking Receipt"
  onclose={() => (receipt = null)}
/>
