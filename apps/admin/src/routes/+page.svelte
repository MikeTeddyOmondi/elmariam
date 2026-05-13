<script lang="ts">
  import { getDashboardStats } from '$lib/remote/analytics.remote';
  import { Card, CardContent, CardHeader, CardTitle } from '@elmariam/ui';
  import { BedDouble, Receipt, GlassWater, ClipboardList } from 'lucide-svelte';

  const stats = getDashboardStats();

  const statDefs = [
    { key: 'bookings',  label: 'Bookings',           icon: BedDouble,     color: 'text-blue-400' },
    { key: 'invoices',  label: 'Invoices',            icon: Receipt,       color: 'text-green-400' },
    { key: 'sales',     label: 'Bar Sales',           icon: GlassWater,    color: 'text-purple-400' },
    { key: 'orders',    label: 'Restaurant Orders',   icon: ClipboardList, color: 'text-orange-400' },
  ] as const;
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Overview of hotel activity</p>
  </div>

  {#await stats}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each Array(4) as _}
        <Card>
          <CardHeader class="pb-2">
            <div class="h-4 w-24 bg-secondary animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div class="h-8 w-12 bg-secondary animate-pulse rounded"></div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:then data}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each statDefs as def}
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium text-muted-foreground">{def.label}</CardTitle>
            <def.icon class="size-4 {def.color}" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-foreground">
              {Array.isArray(data[def.key]) ? data[def.key].length : 0}
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:catch err}
    <div class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      Failed to load stats: {err.message}
    </div>
  {/await}
</div>
