<script lang="ts">
  import { getBookings, getCustomers, getRooms, getInvoices } from '$lib/remote/hotel.remote';
  import { Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import { Users, CalendarDays, BedDouble, Receipt } from 'lucide-svelte';

  let bookings = $state<Awaited<ReturnType<typeof getBookings>>>([] as never);

  let customers = $state<Awaited<ReturnType<typeof getCustomers>>>([] as never);

  let rooms = $state<Awaited<ReturnType<typeof getRooms>>>([] as never);

  let invoices = $state<Awaited<ReturnType<typeof getInvoices>>>([] as never);

  // Queries run in $effect, not at component top level: calling them

  // eagerly fetches during SSR and the result is not hydratable.

  $effect(() => {

    getBookings()

      .then((d) => { bookings = d; })

      .catch(() => {});

    getCustomers()

      .then((d) => { customers = d; })

      .catch(() => {});

    getRooms()

      .then((d) => { rooms = d; })

      .catch(() => {});

    getInvoices()

      .then((d) => { invoices = d; })

      .catch(() => {});

  });

</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Receptionist Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Hotel front-desk overview</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Customers</CardTitle>
          <Users class="size-4 text-blue-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{customers.length}</div></CardContent>
      </Card>

          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
          <CalendarDays class="size-4 text-green-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{bookings.length}</div></CardContent>
      </Card>

          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Available Rooms</CardTitle>
          <BedDouble class="size-4 text-purple-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{rooms.filter((r: any) => !r.isBooked).length}</div></CardContent>
      </Card>

          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
          <Receipt class="size-4 text-orange-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{invoices.length}</div></CardContent>
      </Card>

  </div>
</div>
