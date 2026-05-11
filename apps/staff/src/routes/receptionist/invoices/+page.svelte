<script lang="ts">
  import { getInvoices } from '$lib/remote/hotel.remote';

  const invoices = getInvoices();
</script>

<h1>Invoices</h1>

{#await invoices}
  <p>Loading…</p>
{:then data}
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
          <td>{inv.totalCost?.toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{:catch err}
  <p class="error">{err.message}</p>
{/await}

<style>
  h1 { margin: 0 0 1.5rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .paid { color: #27ae60; font-weight: 600; }
  .pending { color: #f39c12; font-weight: 600; }
  .error { color: red; }
</style>
