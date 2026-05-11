<script lang="ts">
  import { page } from '$app/stores';

  const navLinks = [
    { href: '/receptionist', label: 'Dashboard' },
    { href: '/receptionist/customers', label: 'Customers' },
    { href: '/receptionist/bookings', label: 'Bookings' },
    { href: '/receptionist/rooms', label: 'Rooms' },
    { href: '/receptionist/invoices', label: 'Invoices' },
  ];
</script>

<div class="layout">
  <nav class="sidebar">
    <div class="brand">Receptionist</div>
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
  .sidebar { width: 200px; background: #0f3460; color: #eee; padding: 1rem; flex-shrink: 0; }
  .brand { font-size: 1rem; font-weight: 700; padding: 1rem 0; border-bottom: 1px solid #333; margin-bottom: 1rem; }
  ul { list-style: none; padding: 0; margin: 0; }
  li a { display: block; padding: 0.5rem 0.75rem; color: #ccc; text-decoration: none; border-radius: 4px; }
  li.active a, li a:hover { background: #16213e; color: #fff; }
  .content { flex: 1; padding: 2rem; background: #f5f5f5; }
</style>
