<script lang="ts">
  let { data } = $props();

  const categories = ['appetizer', 'main', 'dessert', 'beverage', 'side'] as const;

  function itemsByCategory(cat: string) {
    return data.menuItems.filter((item: any) => item.category === cat && item.isAvailable);
  }
</script>

<div class="page">
  <h1>Our Menu</h1>
  <p class="subtitle">Fresh ingredients, expertly prepared.</p>

  {#each categories as cat}
    {#if itemsByCategory(cat).length > 0}
      <section>
        <h2>{cat.charAt(0).toUpperCase() + cat.slice(1)}s</h2>
        <div class="grid">
          {#each itemsByCategory(cat) as item}
            <div class="card">
              <h3>{item.name}</h3>
              {#if item.description}<p>{item.description}</p>{/if}
              <span class="price">KES {item.price?.toLocaleString()}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/each}

  {#if data.menuItems.length === 0}
    <p class="empty">Menu coming soon.</p>
  {/if}
</div>

<style>
  .page { max-width: 1100px; margin: 0 auto; padding: 3rem 2rem; }
  h1 { margin: 0 0 0.5rem; font-size: 2rem; color: #1a1a2e; }
  .subtitle { color: #666; margin: 0 0 2.5rem; }
  section { margin-bottom: 2.5rem; }
  h2 { font-size: 1.25rem; color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
  .card { background: #fff; border-radius: 8px; padding: 1.25rem; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
  h3 { margin: 0 0 0.5rem; font-size: 1rem; color: #1a1a2e; }
  .card p { margin: 0 0 0.75rem; color: #666; font-size: 0.9rem; line-height: 1.4; }
  .price { font-weight: 700; color: #c0392b; font-size: 0.95rem; }
  .empty { color: #999; text-align: center; margin-top: 2rem; }
</style>
