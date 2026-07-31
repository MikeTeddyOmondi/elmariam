<script lang="ts">
  import { page } from '$app/stores';
  import { getOneBooking } from '$lib/remote/booking.remote';
  import { Badge, Card, CardContent, Separator, Skeleton, messageFor } from '@elmariam/ui';

  const bookingId = $derived($page.params.id);

  let booking = $state<Awaited<ReturnType<typeof getOneBooking>> | null>(null);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    const id = bookingId;
    if (!id) return;

    loading = true;
    loadError = '';

    getOneBooking(id)
      .then((d) => { booking = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<a href="/portal/bookings" class="text-sm text-muted-foreground hover:text-foreground">
  ← Back to Bookings
</a>

<h1 class="mb-6 mt-4 text-2xl font-bold text-foreground">Booking Details</h1>

<Card class="max-w-lg">
  <CardContent class="py-6">
    {#if loading}
      <div class="space-y-4">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </div>
    {:else if loadError}
      <p class="text-sm text-destructive">{loadError}</p>
    {:else if booking}
      {@const b = booking}
      <dl class="text-sm">
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Room Type</dt>
          <dd class="font-medium capitalize text-foreground">{b.roomType}</dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Check In</dt>
          <dd class="font-medium text-foreground">
            {new Date(b.checkInDate).toLocaleDateString()}
          </dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Check Out</dt>
          <dd class="font-medium text-foreground">
            {new Date(b.checkOutDate).toLocaleDateString()}
          </dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Adults</dt>
          <dd class="font-medium text-foreground">{b.numberAdults}</dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Kids</dt>
          <dd class="font-medium text-foreground">{b.numberKids}</dd>
        </div>
        {#if b.invoice}
          <Separator />
          <div class="flex items-center justify-between py-2">
            <dt class="text-muted-foreground">Invoice Status</dt>
            <dd>
              <Badge
                variant={b.invoice.status === 'paid' ? 'success' : 'warning'}
                class="capitalize"
              >
                {b.invoice.status}
              </Badge>
            </dd>
          </div>
          <Separator />
          <div class="flex items-center justify-between py-2">
            <dt class="text-muted-foreground">Total (KES)</dt>
            <dd class="font-semibold text-foreground">
              {b.invoice.totalCost?.toLocaleString()}
            </dd>
          </div>
        {/if}
      </dl>
    {/if}
  </CardContent>
</Card>
