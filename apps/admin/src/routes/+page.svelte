<script lang="ts">
  import { getDashboardStats } from "$lib/remote/analytics.remote";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Chart,
  } from "@elmariam/ui";
  import { Chart as ChartJS, registerables } from "chart.js";
  import {
    BedDouble,
    Receipt,
    GlassWater,
    ClipboardList,
    TrendingUp,
  } from "lucide-svelte";

  ChartJS.register(...registerables);

  const statDefs = [
    {
      key: "bookings",
      label: "Bookings",
      icon: BedDouble,
      color: "text-blue-400",
    },
    {
      key: "invoices",
      label: "Invoices",
      icon: Receipt,
      color: "text-green-400",
    },
    {
      key: "sales",
      label: "Bar Sales",
      icon: GlassWater,
      color: "text-purple-400",
    },
    {
      key: "orders",
      label: "Restaurant Orders",
      icon: ClipboardList,
      color: "text-orange-400",
    },
  ] as const;

  let statsData = $state<any>(null);
  let statsError = $state("");
  let loading = $state(true);

  const activityConfig: Chart.ChartConfig = {
    bookings: { label: "Bookings", color: "hsl(var(--chart-1))" },
    invoices: { label: "Invoices", color: "hsl(var(--chart-2))" },
    sales: { label: "Bar Sales", color: "hsl(var(--chart-3))" },
    orders: { label: "Restaurant Orders", color: "hsl(var(--chart-4))" },
  };

  const paymentConfig: Chart.ChartConfig = {
    cash: { label: "Cash", color: "hsl(var(--chart-1))" },
    mpesa: { label: "M-Pesa", color: "hsl(var(--chart-2))" },
    bank: { label: "Bank", color: "hsl(var(--chart-3))" },
    unknown: { label: "Other", color: "hsl(var(--chart-5))" },
  };

  const revenueConfig: Chart.ChartConfig = {
    hotel: { label: "Hotel Revenue", color: "hsl(var(--chart-2))" },
    bar: { label: "Bar Revenue", color: "hsl(var(--chart-3))" },
  };

  // Canvas refs
  let activityCanvas = $state<HTMLCanvasElement | null>(null);
  let paymentCanvas = $state<HTMLCanvasElement | null>(null);
  let revenueCanvas = $state<HTMLCanvasElement | null>(null);

  let activityChart: ChartJS | null = null;
  let paymentChart: ChartJS | null = null;
  let revenueChart: ChartJS | null = null;

  function cssVar(name: string) {
    if (typeof document === "undefined") return "#888";
    return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
  }

  $effect(() => {
    getDashboardStats()
      .then((d: any) => {
        statsData = d;
        loading = false;
      })
      .catch((e: any) => {
        statsError = e.message;
        loading = false;
        console.error({ statsError });
      });
  });

  $effect(() => {
    if (!activityCanvas || !statsData) return;
    activityChart?.destroy();
    activityChart = new ChartJS(activityCanvas, {
      type: "bar",
      data: {
        labels: ["Bookings", "Invoices", "Bar Sales", "Restaurant"],
        datasets: [
          {
            data: [
              statsData.bookings.length,
              statsData.invoices.length,
              statsData.sales.length,
              statsData.orders.length,
            ],
            backgroundColor: [
              cssVar("--chart-1"),
              cssVar("--chart-2"),
              cssVar("--chart-3"),
              cssVar("--chart-4"),
            ],
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: cssVar("--muted-foreground") },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: cssVar("--muted-foreground") },
          },
        },
      },
    });
    return () => activityChart?.destroy();
  });

  $effect(() => {
    if (!paymentCanvas || !statsData) return;
    const map: Record<string, number> = {};
    for (const inv of statsData.invoices) {
      const m = inv.paymentMethod || "unknown";
      map[m] = (map[m] || 0) + 1;
    }
    const entries = Object.entries(map);
    paymentChart?.destroy();
    paymentChart = new ChartJS(paymentCanvas, {
      type: "doughnut",
      data: {
        labels: entries.map(([k]) => (paymentConfig as any)[k]?.label ?? k),
        datasets: [
          {
            data: entries.map(([, v]) => v),
            backgroundColor: entries.map(
              ([k]) => (paymentConfig as any)[k]?.color ?? cssVar("--chart-5"),
            ),
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: cssVar("--muted-foreground"),
              padding: 16,
              boxWidth: 12,
            },
          },
        },
      },
    });
    return () => paymentChart?.destroy();
  });

  $effect(() => {
    if (!revenueCanvas || !statsData) return;
    revenueChart?.destroy();
    revenueChart = new ChartJS(revenueCanvas, {
      type: "bar",
      data: {
        labels: ["Hotel", "Bar"],
        datasets: [
          {
            label: "Revenue (KES)",
            data: [
              statsData.invoices.reduce(
                (s: number, i: any) => s + (i.totalCost || 0),
                0,
              ),
              statsData.sales.reduce(
                (s: number, s2: any) => s + (s2.totalStockValue || 0),
                0,
              ),
            ],
            backgroundColor: [cssVar("--chart-2"), cssVar("--chart-3")],
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: cssVar("--muted-foreground") },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: cssVar("--muted-foreground") },
          },
        },
      },
    });
    return () => revenueChart?.destroy();
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
    <p class="text-sm text-muted-foreground mt-1">Overview of hotel activity</p>
  </div>

  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each Array(4) as _}
        <Card>
          <CardHeader class="pb-2"
            ><div
              class="h-4 w-24 bg-secondary animate-pulse rounded"
            ></div></CardHeader
          >
          <CardContent
            ><div
              class="h-8 w-12 bg-secondary animate-pulse rounded"
            ></div></CardContent
          >
        </Card>
      {/each}
    </div>
    <div class="grid gap-6 lg:grid-cols-3">
      {#each [2, 1] as span}
        <Card class={span === 2 ? "lg:col-span-2" : ""}>
          <CardContent class="pt-6"
            ><div
              class="h-64 bg-secondary animate-pulse rounded"
            ></div></CardContent
          >
        </Card>
      {/each}
    </div>
  {:else if statsError}
    <div
      class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      Failed to load stats: {statsError}
    </div>
  {:else if statsData}
    <!-- Stat cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each statDefs as def}
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between pb-2 space-y-0"
          >
            <CardTitle class="text-sm font-medium text-muted-foreground"
              >{def.label}</CardTitle
            >
            <def.icon class="size-4 {def.color}" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-foreground">
              {Array.isArray(statsData[def.key])
                ? statsData[def.key].length
                : 0}
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>

    <!-- Activity + Payment methods -->
    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle class="text-base font-semibold text-foreground"
            >Activity Overview</CardTitle
          >
          <p class="text-xs text-muted-foreground">
            Total records per category
          </p>
        </CardHeader>
        <CardContent>
          <Chart.Container config={activityConfig} class="min-h-[240px] w-full">
            <canvas
              bind:this={activityCanvas}
              class="w-full"
              style="height:240px"
            ></canvas>
          </Chart.Container>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-base font-semibold text-foreground"
            >Payment Methods</CardTitle
          >
          <p class="text-xs text-muted-foreground">Invoice distribution</p>
        </CardHeader>
        <CardContent>
          <Chart.Container config={paymentConfig} class="min-h-[240px] w-full">
            <canvas
              bind:this={paymentCanvas}
              class="w-full"
              style="height:240px"
            ></canvas>
          </Chart.Container>
        </CardContent>
      </Card>
    </div>

    <!-- Revenue + Recent bookings -->
    <div class="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <TrendingUp class="size-4 text-green-400" />
            <CardTitle class="text-base font-semibold text-foreground"
              >Revenue (KES)</CardTitle
            >
          </div>
          <p class="text-xs text-muted-foreground">
            Hotel & bar earnings total
          </p>
        </CardHeader>
        <CardContent>
          <Chart.Container config={revenueConfig} class="min-h-[200px] w-full">
            <canvas
              bind:this={revenueCanvas}
              class="w-full"
              style="height:200px"
            ></canvas>
          </Chart.Container>
        </CardContent>
      </Card>

      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle class="text-base font-semibold text-foreground"
            >Recent Bookings</CardTitle
          >
          <p class="text-xs text-muted-foreground">Latest 5 bookings</p>
        </CardHeader>
        <CardContent class="p-0">
          <table class="w-full text-sm">
            <thead class="border-b border-border">
              <tr>
                {#each ["Guest", "Room Type", "Check-in", "Check-out", "Payment"] as h}
                  <th
                    class="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase"
                    >{h}</th
                  >
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each statsData.bookings.slice(-5).reverse() as b}
                <tr
                  class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td class="px-4 py-2.5 text-foreground">
                    {b.customer?.firstname ?? b.occupant?.firstname ?? "—"}
                    {b.customer?.lastname ?? b.occupant?.lastname ?? ""}
                  </td>
                  <td class="px-4 py-2.5 text-muted-foreground capitalize"
                    >{b.roomType?.roomType ??
                      b["room-type"]?.roomType ??
                      "—"}</td
                  >
                  <td class="px-4 py-2.5 text-muted-foreground"
                    >{b.checkInDate
                      ? new Date(b.checkInDate).toLocaleDateString()
                      : "—"}</td
                  >
                  <td class="px-4 py-2.5 text-muted-foreground"
                    >{b.checkOutDate
                      ? new Date(b.checkOutDate).toLocaleDateString()
                      : "—"}</td
                  >
                  <td class="px-4 py-2.5">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground capitalize"
                    >
                      {b.invoice?.paymentMethod ??
                        b.invoiceRef?.paymentMethod ??
                        "—"}
                    </span>
                  </td>
                </tr>
              {:else}
                <tr
                  ><td
                    colspan="5"
                    class="px-4 py-6 text-center text-sm text-muted-foreground"
                    >No bookings yet</td
                  ></tr
                >
              {/each}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
