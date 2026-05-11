<script lang="ts">
  import { getRoomTypes } from '$lib/remote/hotel.remote';

  const roomTypes = getRoomTypes();
</script>

<h1>Room Types</h1>

{#await roomTypes}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Type</th>
        <th>Rate (KES)</th>
        <th>Capacity</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {#each data as rt}
        <tr>
          <td>{rt.title}</td>
          <td>{rt.roomType}</td>
          <td>{rt.rate.toLocaleString()}</td>
          <td>{rt.capacity}</td>
          <td>{rt.description}</td>
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
  .error { color: red; }
</style>
