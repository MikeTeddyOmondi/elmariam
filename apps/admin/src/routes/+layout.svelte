<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/users', label: 'Users' },
    { href: '/customers', label: 'Customers' },
    { href: '/bookings', label: 'Bookings' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/room-types', label: 'Room Types' },
    { href: '/bar-drinks', label: 'Bar Drinks' },
    { href: '/bar-purchases', label: 'Bar Purchases' },
    { href: '/bar-sales', label: 'Bar Sales' },
    { href: '/menu-items', label: 'Menu Items' },
    { href: '/restaurant-orders', label: 'Restaurant Orders' },
  ];

  const isLoginPage = $derived($page.url.pathname.startsWith('/login'));
</script>

{#if isLoginPage}
  <slot />
{:else}
  <div class="layout">
    <nav class="sidebar">
      <div class="brand">El'Mariam Admin</div>
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
{/if}

<style>
  .layout {
    display: flex;
    min-height: 100vh;
    font-family: system-ui, sans-serif;
  }
  .sidebar {
    width: 220px;
    background: #1a1a2e;
    color: #eee;
    padding: 1rem;
    flex-shrink: 0;
  }
  .brand {
    font-size: 1.1rem;
    font-weight: 700;
    padding: 1rem 0;
    border-bottom: 1px solid #333;
    margin-bottom: 1rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li a {
    display: block;
    padding: 0.5rem 0.75rem;
    color: #ccc;
    text-decoration: none;
    border-radius: 4px;
  }
  li.active a, li a:hover {
    background: #16213e;
    color: #fff;
  }
  .content {
    flex: 1;
    padding: 2rem;
    background: #f5f5f5;
    overflow-y: auto;
  }
</style>
