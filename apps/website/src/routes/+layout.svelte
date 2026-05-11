<script lang="ts">
  import { page } from '$app/stores';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/restaurant', label: 'Restaurant' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isPortal = $derived($page.url.pathname.startsWith('/portal'));
</script>

<header>
  <nav class="nav">
    <a href="/" class="brand">El'Mariam</a>
    <ul class="links">
      {#each navLinks as link}
        <li class:active={$page.url.pathname === link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      {/each}
      {#if isPortal}
        <li><a href="/portal">My Portal</a></li>
      {:else}
        <li><a href="/login" class="cta">Book Now</a></li>
      {/if}
    </ul>
  </nav>
</header>

<main>
  <slot />
</main>

<footer>
  <p>&copy; {new Date().getFullYear()} El'Mariam Hotel. All rights reserved.</p>
</footer>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(body) { margin: 0; font-family: system-ui, sans-serif; color: #333; }
  header { background: #1a1a2e; color: #fff; padding: 0 2rem; }
  .nav { display: flex; align-items: center; justify-content: space-between; height: 64px; max-width: 1100px; margin: 0 auto; }
  .brand { color: #fff; text-decoration: none; font-size: 1.3rem; font-weight: 700; letter-spacing: 0.05em; }
  .links { list-style: none; display: flex; gap: 1.5rem; margin: 0; padding: 0; align-items: center; }
  .links li a { color: #ccc; text-decoration: none; font-size: 0.95rem; }
  .links li.active a, .links li a:hover { color: #fff; }
  .cta { background: #c0392b; color: #fff !important; padding: 0.4rem 1rem; border-radius: 4px; }
  main { min-height: calc(100vh - 64px - 60px); }
  footer { background: #1a1a2e; color: #666; text-align: center; padding: 1rem; font-size: 0.85rem; }
</style>
