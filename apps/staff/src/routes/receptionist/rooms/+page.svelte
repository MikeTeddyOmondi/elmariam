<script lang="ts">
  import { getRooms, getRoomTypes } from '$lib/remote/hotel.remote';

  const rooms = getRooms();
  const roomTypes = getRoomTypes();
</script>

<h1>Rooms</h1>

<div class="sections">
  <section>
    <h2>All Rooms</h2>
    {#await rooms}
      <p>Loading…</p>
    {:then data}
      <table>
        <thead><tr><th>Room #</th><th>Status</th></tr></thead>
        <tbody>
          {#each data as room}
            <tr>
              <td>{room.number}</td>
              <td><span class:booked={room.isBooked} class:available={!room.isBooked}>{room.isBooked ? 'Booked' : 'Available'}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <p class="error">{err.message}</p>
    {/await}
  </section>

  <section>
    <h2>Room Types</h2>
    {#await roomTypes}
      <p>Loading…</p>
    {:then data}
      <table>
        <thead><tr><th>Title</th><th>Type</th><th>Rate</th><th>Capacity</th></tr></thead>
        <tbody>
          {#each data as rt}
            <tr>
              <td>{rt.title}</td>
              <td>{rt.roomType}</td>
              <td>KES {rt.rate?.toLocaleString()}</td>
              <td>{rt.capacity}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:catch err}
      <p class="error">{err.message}</p>
    {/await}
  </section>
</div>

<style>
  h1 { margin: 0 0 1.5rem; }
  h2 { margin: 0 0 1rem; font-size: 1.1rem; }
  .sections { display: flex; flex-direction: column; gap: 2rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f0f0f0; font-size: 0.85rem; text-transform: uppercase; color: #555; }
  .booked { color: #c0392b; font-weight: 600; }
  .available { color: #27ae60; font-weight: 600; }
  .error { color: red; }
</style>
