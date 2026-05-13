<script lang="ts">
  import { getBookings, initiateMpesaPayment, sendSmsNotification } from '$lib/remote/hotel.remote';
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  const bookings = getBookings();
  let actionMsg = $state('');
  let actionError = $state(false);

  async function triggerMpesa(bookingId: string) {
    actionError = false;
    try {
      await initiateMpesaPayment({ bookingId });
      actionMsg = 'M-Pesa STK push initiated.';
    } catch (err: any) {
      actionMsg = err.message;
      actionError = true;
    }
  }

  async function triggerSms(bookingId: string) {
    actionError = false;
    try {
      await sendSmsNotification({ bookingId });
      actionMsg = 'SMS notification sent.';
    } catch (err: any) {
      actionMsg = err.message;
      actionError = true;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Bookings</h1>
      <p class="text-sm text-muted-foreground mt-1">Manage guest reservations</p>
    </div>
    <a href="/receptionist/bookings/new"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
      + New Booking
    </a>
  </div>

  {#if actionMsg}
    <Alert variant={actionError ? 'destructive' : 'default'}>
      <AlertDescription>{actionMsg}</AlertDescription>
    </Alert>
  {/if}

  {#await bookings}
    <p class="text-sm text-muted-foreground">Loading…</p>
  {:then data}
    <div class="w-full border border-border rounded-xl overflow-hidden bg-card">
      <table class="w-full text-sm">
        <thead class="bg-secondary/50">
          <tr>
            {#each ['Customer','Room Type','Check In','Check Out','Adults','Kids','Actions'] as h}
              <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as b}
            <tr class="border-t border-border hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground">{b.customer?.firstname ?? '-'} {b.customer?.lastname ?? ''}</td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{b.roomType}</td>
              <td class="px-4 py-3 text-muted-foreground">{new Date(b.checkInDate).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-muted-foreground">{new Date(b.checkOutDate).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-muted-foreground">{b.numberAdults}</td>
              <td class="px-4 py-3 text-muted-foreground">{b.numberKids}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <Button variant="outline" onclick={() => triggerMpesa(b._id)} class="h-7 px-2 text-xs">M-Pesa</Button>
                  <Button variant="outline" onclick={() => triggerSms(b._id)} class="h-7 px-2 text-xs">SMS</Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:catch err}
    <Alert variant="destructive"><AlertDescription>{err.message}</AlertDescription></Alert>
  {/await}
</div>
