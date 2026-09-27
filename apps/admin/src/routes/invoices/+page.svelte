<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getInvoices } from '$lib/remote/hotel.remote';
  import {
    Badge, Card, CardContent, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    toastError
  } from '@elmariam/ui';

  type Invoice = Awaited<ReturnType<typeof getInvoices>>[number];

  let invoices = $state<Invoice[]>([]);
  let loading = $state(true);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getInvoices()
      .then((d) => { invoices = d as Invoice[]; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  const totalBilled = $derived(
    invoices.reduce((sum, i) => sum + (i.totalCost ?? 0), 0)
  );
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Invoices</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Billing raised against bookings
      {#if !loading && invoices.length}
        <span class="text-foreground">({invoices.length} total, KES {totalBilled.toLocaleString()})</span>
      {/if}
    </p>
  </div>

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
{:else}
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking Ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead class="text-right">Sub Total</TableHead>
              <TableHead class="text-right">VAT</TableHead>
              <TableHead class="text-right">Total (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each invoices.slice((__page - 1) * __perPage, __page * __perPage) as inv}
              <TableRow>
                <TableCell class="font-mono text-xs text-muted-foreground">{inv.bookingRef}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} class="capitalize">
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell class="capitalize text-muted-foreground">{inv.paymentMethod}</TableCell>
                <TableCell class="text-right text-muted-foreground">{inv.subTotalCost?.toLocaleString()}</TableCell>
                <TableCell class="text-right text-muted-foreground">{inv.vat?.toLocaleString()}</TableCell>
                <TableCell class="text-right font-semibold text-foreground">{inv.totalCost?.toLocaleString()}</TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={6} class="py-6 text-center text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={invoices.length} perPage={__perPage} label="invoices" />
      </div>
      </div>
    {/if}
  </Card>
</div>
