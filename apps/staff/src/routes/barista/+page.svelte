<script lang="ts">
  import { getDrinks, getBarPurchases, getBarSales } from '$lib/remote/bar.remote';
  import { Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import { GlassWater, PackageCheck, ShoppingCart, BarChart3 } from 'lucide-svelte';

  const drinks = getDrinks();
  const purchases = getBarPurchases();
  const sales = getBarSales();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Barista Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Bar inventory and sales overview</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#await drinks then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Drinks</CardTitle>
          <GlassWater class="size-4 text-blue-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
          <PackageCheck class="size-4 text-green-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.filter((d: any) => d.inStock).length}</div></CardContent>
      </Card>
    {/await}
    {#await purchases then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Purchases</CardTitle>
          <ShoppingCart class="size-4 text-purple-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
    {#await sales then data}
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Sales</CardTitle>
          <BarChart3 class="size-4 text-orange-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{data.length}</div></CardContent>
      </Card>
    {/await}
  </div>
</div>
