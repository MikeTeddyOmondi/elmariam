<script lang="ts">
  import { page } from '$app/stores';

  const navLinks = [
    { href: '/portal', label: 'Overview' },
    { href: '/portal/bookings', label: 'My Bookings' },
    { href: '/portal/invoices', label: 'Invoices' },
    { href: '/portal/profile', label: 'Profile' },
  ];
</script>

<div class="portal-layout">
  <nav class="sidebar">
    <div class="brand">My Portal</div>
    <ul>
      {#each navLinks as link}
        <li class:active={$page.url.pathname === link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      {/each}
    </ul>
    <a href="/" class="back-link">← Back to site</a>
  </nav>
  <main class="content">
    <slot />
  </main>
</div>

<style>
  .portal-layout { display: flex; min-height: calc(100vh - 64px); font-family: system-ui, sans-serif; }
  .sidebar { width: 220px; background: #1a1a2e; color: #eee; padding: 1.5rem 1rem; flex-shrink: 0; display: flex; flex-direction: column; }
  .brand { font-size: 1rem; font-weight: 700; padding-bottom: 1rem; border-bottom: 1px solid #333; margin-bottom: 1rem; }
  ul { list-style: none; padding: 0; margin: 0; flex: 1; }
  li a { display: block; padding: 0.5rem 0.75rem; color: #ccc; text-decoration: none; border-radius: 4px; }
  li.active a, li a:hover { background: #16213e; color: #fff; }
  .back-link { color: #888; font-size: 0.85rem; text-decoration: none; margin-top: 1rem; }
  .content { flex: 1; padding: 2rem; background: #f9f9f9; }
</style>
