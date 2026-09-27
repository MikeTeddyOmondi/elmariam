<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import {
    getBookings, getCustomers, getInvoices, createBooking, initiateMpesaPayment, sendSmsNotification
  } from '$lib/remote/hotel.remote';
  import {
    Button, Dialog, Form, Input, Label, SelectField,
    ReceiptDialog, type ReceiptData,
    toast, toastError } from '@elmariam/ui';
  import CalendarPlus from 'lucide-svelte/icons/calendar-plus';
  import Printer from 'lucide-svelte/icons/printer';
  import Smartphone from 'lucide-svelte/icons/smartphone';
  import MessageSquare from 'lucide-svelte/icons/message-square';
  import { can } from '$lib/permissions';

  type Row = Awaited<ReturnType<typeof getBookings>>[number];

  let bookings = $state<Row[]>([]);
  let loading = $state(true);

  // Invoices carry the money; a booking receipt joins to its invoice by bookingRef.
  let invoices = $state<Awaited<ReturnType<typeof getInvoices>>>([] as never);

  // Receipt preview (after a create, and re-openable from any row).
  let receipt = $state<ReceiptData | null>(null);

  // Queries run in $effect, not at component top level: calling them
  // eagerly fetches during SSR and the result is not hydratable.
  $effect(() => {
    Promise.all([getBookings(), getInvoices()])
      .then(([b, i]) => { bookings = b as Row[]; invoices = i; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  function receiptForBooking(b: Row): ReceiptData {
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

  // Create lives in a modal opened from the header, not a separate route.
  let showCreate = $state(false);

  // The customer picker needs the catalogue. A failure only disables the form,
  // so it does not set `loadError` and hide the bookings table with it.
  let customers = $state<Awaited<ReturnType<typeof getCustomers>>>([] as never);
  let customersLoading = $state(true);

  $effect(() => {
    getCustomers()
      .then((d) => { customers = d; customersLoading = false; })
      .catch(() => { customersLoading = false; });
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

  // Cosmetic: the create route guards itself in +page.server.ts, and the
  // remote function guards itself too. This just hides a link that would
  // only 403 for a read-only role.
  const canWrite = $derived(can('bookings:write'));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Bookings</h1>
      <p class="text-sm text-muted-foreground mt-1">Manage guest reservations</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <CalendarPlus />
        New Booking
      </Button>
    {/if}
  </div>

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading…</p>
{:else}
      {@const data = bookings.slice((__page - 1) * __perPage, __page * __perPage)}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Customer','Room Type','Check In','Check Out','Adults','Kids','Actions'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as b}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground">{b.customer?.firstname ?? '-'} {b.customer?.lastname ?? ''}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{b.roomType?.roomType ?? '-'}</td>
              <td class="px-4 py-3 text-muted-foreground">{new Date(b.checkInDate).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-muted-foreground">{new Date(b.checkOutDate).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-muted-foreground">{b.numberAdults}</td>
              <td class="px-4 py-3 text-muted-foreground">{b.numberKids}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <Button variant="outline" onclick={() => triggerMpesa(b.id)} class="h-7 px-2 text-xs">
                    <Smartphone class="size-3" />
                    M-Pesa
                  </Button>
                  <Button variant="outline" onclick={() => triggerSms(b.id)} class="h-7 px-2 text-xs">
                    <MessageSquare class="size-3" />
                    SMS
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7"
                    aria-label="Print receipt for booking {b.id}"
                    title="Print receipt"
                    onclick={() => (receipt = receiptForBooking(b))}
                  >
                    <Printer />
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={bookings.length} perPage={__perPage} label="bookings" />
      </div>
    </div>
  {/if}
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="New Booking"
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
            // Refresh + preview the newest booking's receipt (list is desc).
            [bookings, invoices] = await Promise.all([
              getBookings().run() as Promise<Row[]>,
              getInvoices().run(),
            ]);
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
        <Label for="customer">Customer</Label>
        <!-- `createBooking` looks the customer up by ID number, not ObjectId. -->
        <SelectField
          id="customer"
          disabled={customersLoading}
          items={customerOptions}
          placeholder={customersLoading ? 'Loading' : 'Select customer'}
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
