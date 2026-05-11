<script lang="ts">
  import { getMyInvoices } from '$lib/remote/booking.remote';

  const invoices = getMyInvoices();
</script>

<h1>Invoices</h1>

{#await invoices}
  <p>Loading…</p>
{:then data}
  {#if data.length === 0}
    <p class="empty">No invoices yet.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Booking Ref</th><th>Status</th><th>Payment</th><th>Sub Total</th><th>VAT</th><th>Total (KES)</th></tr>
      </thead>
      <tbody>
        {#each data as inv}
          <tr>
            <td>{inv.bookingRef}</td>
            <td><span class:paid={inv.status === 'paid'} class:pending={inv.status === 'pending'}>{inv.status}</span></td>
            <td>{inv.paymentMethod}</td>
            <td>{inv.subTotalCost?.toLocaleString()}</td>
            <td>{inv.vat?.toLocaleString()}</td>
            <td><strong>{inv.totalCost?.toLocaleString()}</strong></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  h1 { margin: 0 0 1.5rem; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .paid { color: #27ae60; font-weight: 600; }
  .pending { color: #f39c12; font-weight: 600; }
  .empty { color: #999; }
  .error { color: red; }
</style>
