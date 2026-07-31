<script lang="ts">
  import { getDrinks, getBarPurchases, getBarSales } from '$lib/remote/bar.remote';
  import { Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import { GlassWater, PackageCheck, ShoppingCart, BarChart3 } from 'lucide-svelte';

  let drinks = $state<Awaited<ReturnType<typeof getDrinks>>>([] as never);

  let purchases = $state<Awaited<ReturnType<typeof getBarPurchases>>>([] as never);

  let sales = $state<Awaited<ReturnType<typeof getBarSales>>>([] as never);

  // Queries run in $effect, not at component top level: calling them

  // eagerly fetches during SSR and the result is not hydratable.

  $effect(() => {

    getDrinks()

      .then((d) => { drinks = d; })

      .catch(() => {});

    getBarPurchases()

      .then((d) => { purchases = d; })

      .catch(() => {});

    getBarSales()

      .then((d) => { sales = d; })

      .catch(() => {});

  });

</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Barista Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Bar inventory and sales overview</p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Drinks</CardTitle>
          <GlassWater class="size-4 text-blue-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{drinks.length}</div></CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
          <PackageCheck class="size-4 text-green-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{drinks.filter((d: any) => d.inStock).length}</div></CardContent>
      </Card>

          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Purchases</CardTitle>
          <ShoppingCart class="size-4 text-purple-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{purchases.length}</div></CardContent>
      </Card>

          <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle class="text-sm font-medium text-muted-foreground">Sales</CardTitle>
          <BarChart3 class="size-4 text-orange-400" />
        </CardHeader>
        <CardContent><div class="text-3xl font-bold text-foreground">{sales.length}</div></CardContent>
      </Card>

  </div>
</div>
