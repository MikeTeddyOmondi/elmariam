<script lang="ts">
  import { getMenuItems, getOrders } from '$lib/remote/restaurant.remote';
  import { Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import { UtensilsCrossed, ClipboardList, CheckCheck } from 'lucide-svelte';

  const menuItems = getMenuItems();
  const orders = getOrders();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Waiter Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Restaurant orders overview</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-3">
    {#await menuItems then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Menu Items</CardTitle>
          <UtensilsCrossed class="size-4 text-blue-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
    {#await orders then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
          <ClipboardList class="size-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-foreground">
            {data.filter((o: any) => !['served', 'cancelled'].includes(o.status)).length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          <CheckCheck class="size-4 text-green-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
  </div>
</div>
