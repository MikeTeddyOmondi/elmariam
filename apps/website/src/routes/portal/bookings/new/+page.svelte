<script lang="ts">
  import { goto } from '$app/navigation';
  import { createBooking } from '$lib/remote/booking.remote';
  import { getRoomTypes } from '$lib/remote/catalog.remote';
  import { getMyProfile } from '$lib/remote/account.remote';
  import { Button, Form, Input, Label, SelectField, Skeleton, toast, toastError } from '@elmariam/ui';
  import UserPen from 'lucide-svelte/icons/user-pen';

  type RoomType = Awaited<ReturnType<typeof getRoomTypes>>[number];

  let roomTypes = $state<RoomType[]>([]);
  let roomTypesLoaded = $state(false);
  // Booking needs a customer profile; checked up front so the visitor is sent
  // to fill it in rather than meeting a 409 after completing this form.
  let hasProfile = $state<boolean | null>(null);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getRoomTypes()
      .then((d) => { roomTypes = d; roomTypesLoaded = true; })
      .catch(() => { roomTypes = []; roomTypesLoaded = true; });

    getMyProfile()
      .then((p) => { hasProfile = !!p; })
      .catch((e) => { toastError(e); hasProfile = false; });
  });

  // Only the room types that exist, labelled with their rate, rather than a
  // fixed single/double list that could offer a type the hotel does not have.
  const roomTypeOptions = $derived(
    roomTypes.map((rt) => ({
      value: rt.roomType,
      label: `${rt.title} (KES ${rt.rate?.toLocaleString()} / night)`
    }))
  );

  const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank', label: 'Bank Transfer' }
  ];
</script>

<a href="/portal/bookings" class="text-sm text-muted-foreground hover:text-foreground">← Back</a>
<h1 class="mb-6 mt-4 text-2xl font-bold text-foreground">New Booking</h1>

<div class="flex flex-wrap items-start gap-8">
  <!-- Wait for room types too, so the select is built with its options and default. -->
  {#if hasProfile === null || !roomTypesLoaded}
    <div class="flex min-w-70 flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-6">
      {#each { length: 6 } as _, i (i)}
        <Skeleton class="h-10 w-full" />
      {/each}
    </div>
  {:else if !hasProfile}
    <div class="flex min-w-70 flex-1 flex-col items-start gap-4 rounded-xl border border-border bg-card p-6">
      <UserPen class="size-6 text-muted-foreground" />
      <div>
        <h2 class="font-semibold text-card-foreground">Complete your profile first</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          We need your name, ID number and phone number before we can hold a room for you.
          It takes a minute, and you will come straight back here.
        </p>
      </div>
      <Button href="/portal/profile?next=/portal/bookings/new">Complete profile</Button>
    </div>
  {:else}
    <!--
      `{...createBooking.enhance(...)}` keeps the progressive-enhancement
      fallback: with JavaScript disabled the browser posts the form normally.
      The customer is resolved from the session server-side and is never sent.
    -->
    <form
      {...createBooking.enhance(async ({ submit, element }) => {
        try {
          // `submit()` resolves to false when the server returns validation
          // issues: it does not throw. Toasting unconditionally would report
          // success on an invalid form.
          const ok = await submit();
          if (!ok) return;
          // `enhance` neither resets nor navigates on its own.
          element.reset();
          toast.success('Booking created.');
          // The server refreshed `getMyBookings()` with this submission, so the
          // list shows the new booking straight away.
          await goto('/portal/bookings');
        } catch (e) {
          toastError(e);
        }
      })}
      class="flex min-w-70 flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-6"
    >
      <Form.Message issues={createBooking.fields.allIssues()} />

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
        <SelectField
          id="roomType"
          items={roomTypeOptions}
          {...createBooking.fields.roomType.as('select', roomTypes[0]?.roomType ?? '')}
        />
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
        <SelectField
          id="paymentMethod"
          items={PAYMENT_OPTIONS}
          {...createBooking.fields.paymentMethod.as('select', 'cash')}
        />
        <Form.FieldErrors issues={createBooking.fields.paymentMethod.issues()} />
      </Form.Field>

      <Button type="submit" disabled={createBooking.pending > 0}>
        {createBooking.pending > 0 ? 'Booking…' : 'Book Now'}
      </Button>
    </form>
  {/if}

  <aside class="min-w-56 rounded-xl border border-border bg-card p-6">
    <h3 class="mb-4 font-semibold text-card-foreground">Room Rates</h3>
    {#each roomTypes as rt (rt.id)}
      <div class="flex justify-between border-b border-border py-2 text-sm last:border-0">
        <strong class="text-foreground">{rt.title}</strong>
        <span class="text-muted-foreground">KES {rt.rate?.toLocaleString()} / night</span>
      </div>
    {:else}
      <p class="text-sm text-muted-foreground">Loading…</p>
    {/each}
  </aside>
</div>
