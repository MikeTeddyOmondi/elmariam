<script lang="ts">
  import { page } from '$app/stores';

  const navLinks = [
    { href: '/barista', label: 'Dashboard' },
    { href: '/barista/drinks', label: 'Drinks' },
    { href: '/barista/purchases', label: 'Purchases' },
    { href: '/barista/sales', label: 'Sales' },
  ];
</script>

<div class="layout">
  <nav class="sidebar">
    <div class="brand">Barista</div>
    <ul>
      {#each navLinks as link}
        <li class:active={$page.url.pathname === link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      {/each}
    </ul>
  </nav>
  <main class="content">
    <slot />
  </main>
</div>

<style>
  .layout { display: flex; min-height: 100vh; font-family: system-ui, sans-serif; }
  .sidebar { width: 200px; background: #2c3e50; color: #eee; padding: 1rem; flex-shrink: 0; }
  .brand { font-size: 1rem; font-weight: 700; padding: 1rem 0; border-bottom: 1px solid #444; margin-bottom: 1rem; }
  ul { list-style: none; padding: 0; margin: 0; }
  li a { display: block; padding: 0.5rem 0.75rem; color: #ccc; text-decoration: none; border-radius: 4px; }
  li.active a, li a:hover { background: #1a252f; color: #fff; }
  .content { flex: 1; padding: 2rem; background: #f5f5f5; }
</style>
