<script lang="ts">
  import { getMyBookings } from '$lib/remote/booking.remote';
  import {
    Button,
    Card,
    CardContent,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    messageFor
  } from '@elmariam/ui';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import Plus from 'lucide-svelte/icons/plus';

  type Booking = Awaited<ReturnType<typeof getMyBookings>>[number];

  let bookings = $state<Booking[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable, which surfaces as
  // `hydratable_missing_but_required` on the client.
  $effect(() => {
    getMyBookings()
      .then((d) => { bookings = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="mb-6 flex items-center justify-between">
  <h1 class="text-2xl font-bold text-foreground">My Bookings</h1>
  <Button href="/portal/bookings/new"><Plus /> New Booking</Button>
</div>

{#if loading}
  <Card>
    <CardContent class="space-y-3 py-6">
      {#each { length: 4 } as _}
        <Skeleton class="h-5 w-full" />
      {/each}
    </CardContent>
  </Card>
{:else if loadError}
  <Card>
    <CardContent class="py-6 text-sm text-destructive">{loadError}</CardContent>
  </Card>
{:else if bookings.length === 0}
  <Card>
    <CardContent class="py-10 text-center text-sm text-muted-foreground">
      No bookings yet. <a class="text-accent underline" href="/portal/bookings/new">Book a room</a>.
    </CardContent>
  </Card>
{:else}
  <Card class="overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Room Type</TableHead>
          <TableHead>Check In</TableHead>
          <TableHead>Check Out</TableHead>
          <TableHead class="text-right">Adults</TableHead>
          <TableHead class="text-right">Kids</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each bookings as b}
          <TableRow>
            <TableCell class="font-medium capitalize">{b.roomType}</TableCell>
            <TableCell>{new Date(b.checkInDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(b.checkOutDate).toLocaleDateString()}</TableCell>
            <TableCell class="text-right">{b.numberAdults}</TableCell>
            <TableCell class="text-right">{b.numberKids}</TableCell>
            <TableCell class="text-right">
              <Button
                variant="ghost"
                size="icon"
                href="/portal/bookings/{b._id}"
                aria-label="View booking details"
              >
                <ArrowRight />
              </Button>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </Card>
{/if}
