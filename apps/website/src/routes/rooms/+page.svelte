<script lang="ts">
  let { data } = $props();
</script>

<div class="page">
  <h1>Our Rooms</h1>
  <p class="subtitle">All rooms are fully furnished with modern amenities.</p>

  <div class="grid">
    {#each data.roomTypes as rt}
      <div class="card">
        <div class="room-type">{rt.roomType}</div>
        <h2>{rt.title}</h2>
        <p>{rt.description}</p>
        <div class="details">
          <span>Capacity: {rt.capacity} guests</span>
          <span class="rate">KES {rt.rate?.toLocaleString()} / night</span>
        </div>
        <a href="/login" class="btn">Book This Room</a>
      </div>
    {/each}
  </div>

  {#if data.roomTypes.length === 0}
    <p class="empty">No room types available at this time.</p>
  {/if}
</div>

<style>
  .page { max-width: 1100px; margin: 0 auto; padding: 3rem 2rem; }
  h1 { margin: 0 0 0.5rem; font-size: 2rem; color: #1a1a2e; }
  .subtitle { color: #666; margin: 0 0 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
  .card { background: #fff; border-radius: 8px; padding: 1.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 0.75rem; }
  .room-type { text-transform: uppercase; font-size: 0.75rem; font-weight: 700; color: #c0392b; letter-spacing: 0.1em; }
  h2 { margin: 0; font-size: 1.3rem; color: #1a1a2e; }
  .card p { margin: 0; color: #666; line-height: 1.5; flex: 1; }
  .details { display: flex; justify-content: space-between; font-size: 0.9rem; color: #555; }
  .rate { font-weight: 700; color: #1a1a2e; }
  .btn { background: #1a1a2e; color: #fff; padding: 0.6rem 1.25rem; border-radius: 4px; text-decoration: none; text-align: center; font-size: 0.9rem; }
  .empty { color: #999; text-align: center; margin-top: 2rem; }
</style>
