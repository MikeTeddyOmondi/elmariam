<script lang="ts">
  import { getBookings, getCustomers, getRooms, getInvoices } from '$lib/remote/hotel.remote';
  import { Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import { Users, CalendarDays, BedDouble, Receipt } from 'lucide-svelte';

  const bookings = getBookings();
  const customers = getCustomers();
  const rooms = getRooms();
  const invoices = getInvoices();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Receptionist Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Hotel front-desk overview</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#await customers then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Customers</CardTitle>
          <Users class="size-4 text-blue-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
    {#await bookings then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
          <CalendarDays class="size-4 text-green-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
    {#await rooms then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Available Rooms</CardTitle>
          <BedDouble class="size-4 text-purple-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.filter((r: any) => !r.isBooked).length}</div></CardContent>
      </Card>
    {/await}
    {#await invoices then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
          <Receipt class="size-4 text-orange-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
  </div>
</div>
