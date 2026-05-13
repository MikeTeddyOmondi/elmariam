<script lang="ts">
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import { Separator, ThemeToggle } from '@elmariam/ui';
  import { LayoutDashboard, CalendarDays, Receipt, User } from 'lucide-svelte';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  const navLinks = [
    { href: '/portal',           label: 'Overview',     icon: LayoutDashboard },
    { href: '/portal/bookings',  label: 'My Bookings',  icon: CalendarDays },
    { href: '/portal/invoices',  label: 'Invoices',     icon: Receipt },
    { href: '/portal/profile',   label: 'Profile',      icon: User },
  ];

  function isActive(href: string) {
    return href === '/portal'
      ? $page.url.pathname === '/portal'
      : $page.url.pathname.startsWith(href);
  }
</script>

<div class="flex min-h-screen bg-background text-foreground">
  <!-- Portal sidebar — flush with header, using sidebar CSS vars -->
  <aside class="w-56 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
    <!-- Brand aligned with the site header logo -->
    <div class="px-4 py-5">
      <span class="text-sidebar-foreground font-bold text-sm tracking-tight">
        El'Mariam <span class="text-accent">Portal</span>
      </span>
    </div>

    <Separator class="bg-sidebar-border" />

    <nav class="flex-1 px-2 py-3 space-y-0.5">
      {#each navLinks as link}
        {@const active = isActive(link.href)}
        <a
          href={link.href}
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
            {active
              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
        >
          <link.icon class="size-4 flex-shrink-0" />
          {link.label}
        </a>
      {/each}
    </nav>

    <Separator class="bg-sidebar-border" />

    <div class="px-2 py-3 space-y-0.5">
      <div class="flex items-center justify-between px-3 py-2 rounded-md">
        <span class="text-xs text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>
      <a
        href="/"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        ← Back to site
      </a>
    </div>
  </aside>

  <!-- Content area -->
  <main class="flex-1 overflow-y-auto bg-background">
    <div class="p-6">
      {@render children()}
    </div>
  </main>
</div>
