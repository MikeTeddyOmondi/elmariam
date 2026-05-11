<script lang="ts">
  import { getRooms } from '$lib/remote/hotel.remote';

  const rooms = getRooms();
</script>

<h1>Rooms</h1>

{#await rooms}
  <p>Loading…</p>
{:then data}
  <table>
    <thead>
      <tr>
        <th>Room Number</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {#each data as room}
        <tr>
          <td>{room.number}</td>
          <td>
            <span class:booked={room.isBooked} class:available={!room.isBooked}>
              {room.isBooked ? 'Booked' : 'Available'}
            </span>
          </td>
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
  .booked { color: #c0392b; font-weight: 600; }
  .available { color: #27ae60; font-weight: 600; }
  .error { color: red; }
</style>
