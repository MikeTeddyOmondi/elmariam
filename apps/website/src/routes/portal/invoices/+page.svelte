<script lang="ts">
  import { getMyInvoices } from '$lib/remote/booking.remote';
  import {
    Badge,
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

  type Invoice = Awaited<ReturnType<typeof getMyInvoices>>[number];

  let invoices = $state<Invoice[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMyInvoices()
      .then((d) => { invoices = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<h1 class="mb-6 text-2xl font-bold text-foreground">Invoices</h1>

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
{:else if invoices.length === 0}
  <Card>
    <CardContent class="py-10 text-center text-sm text-muted-foreground">
      No invoices yet.
    </CardContent>
  </Card>
{:else}
  <Card class="overflow-hidden">
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
        {#each invoices as inv}
          <TableRow>
            <TableCell class="font-medium">{inv.bookingRef}</TableCell>
            <TableCell>
              <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} class="capitalize">
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell class="capitalize text-muted-foreground">{inv.paymentMethod}</TableCell>
            <TableCell class="text-right">{inv.subTotalCost?.toLocaleString()}</TableCell>
            <TableCell class="text-right">{inv.vat?.toLocaleString()}</TableCell>
            <TableCell class="text-right font-semibold">{inv.totalCost?.toLocaleString()}</TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </Card>
{/if}
