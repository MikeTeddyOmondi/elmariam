<script lang="ts">
  import { getMyBookings, getMyInvoices } from '$lib/remote/booking.remote';
  import { Button, Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import BedDouble from 'lucide-svelte/icons/bed-double';
  import Receipt from 'lucide-svelte/icons/receipt';
  import Plus from 'lucide-svelte/icons/plus';

  let bookingCount = $state(0);
  let invoiceCount = $state(0);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMyBookings()
      .then((d) => { bookingCount = d.length; })
      .catch(() => { bookingCount = 0; });

    getMyInvoices()
      .then((d) => { invoiceCount = d.length; })
      .catch(() => { invoiceCount = 0; });
  });
</script>

<h1 class="mb-6 text-2xl font-bold text-foreground">Welcome Back</h1>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Card>
    <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
      <BedDouble class="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <p class="text-3xl font-bold text-foreground">{bookingCount}</p>
      <Button variant="link" href="/portal/bookings" class="px-0">View all →</Button>
    </CardContent>
  </Card>

  <Card>
    <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
      <Receipt class="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <p class="text-3xl font-bold text-foreground">{invoiceCount}</p>
      <Button variant="link" href="/portal/invoices" class="px-0">View all →</Button>
    </CardContent>
  </Card>

  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-muted-foreground">New Booking</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <p class="text-sm text-muted-foreground">Book a room for your next stay.</p>
      <Button href="/portal/bookings/new"><Plus /> Book Now</Button>
    </CardContent>
  </Card>
</div>
