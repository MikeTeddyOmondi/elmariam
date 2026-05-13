<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import { ThemeToggle } from '@elmariam/ui';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  const navLinks = [
    { href: '/',            label: 'Home' },
    { href: '/rooms',       label: 'Rooms' },
    { href: '/restaurant',  label: 'Restaurant' },
    { href: '/about',       label: 'About' },
    { href: '/contact',     label: 'Contact' },
  ];

  const isPortal = $derived($page.url.pathname.startsWith('/portal'));
  const isLoginPage = $derived($page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register'));

  function isActive(href: string) {
    return href === '/'
      ? $page.url.pathname === '/'
      : $page.url.pathname.startsWith(href);
  }
</script>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <!-- Header -->
    <header class="border-b border-border bg-card sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" class="text-foreground font-bold text-xl tracking-tight">
          El'Mariam <span class="text-accent">Hotel</span>
        </a>

        <nav class="hidden md:flex items-center gap-1">
          {#each navLinks as link}
            {@const active = isActive(link.href)}
            <a
              href={link.href}
              class="px-3 py-2 rounded-md text-sm transition-colors
                {active
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'}"
            >
              {link.label}
            </a>
          {/each}
        </nav>

        <div class="flex items-center gap-2">
          <ThemeToggle />
          {#if isPortal}
            <a
              href="/portal"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              My Portal
            </a>
          {:else}
            <a
              href="/login"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium
                     bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 transition-colors"
            >
              Book Now
            </a>
          {/if}
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1">
      {@render children()}
    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-card py-6 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} El'Mariam Hotel. All rights reserved.
    </footer>
  </div>
{/if}
