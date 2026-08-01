<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import { Separator, ThemeToggle, Toaster } from '@elmariam/ui';
  // Imported from the `/rbac` subpath, not the package root: the root barrel
  // also exports `subjects`, which would pull openauth into the client bundle.
  import { canAccessStaffSection } from '@elmariam/auth/rbac';
  import {
    LayoutDashboard, CalendarDays, UtensilsCrossed,
    ClipboardList, GlassWater, ShoppingCart, LogOut,
  } from 'lucide-svelte';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  const sectionLinks = [
    { section: 'receptionist', href: '/receptionist', label: 'Receptionist', icon: CalendarDays },
    { section: 'barista',      href: '/barista',      label: 'Barista',      icon: GlassWater },
    { section: 'waiter',       href: '/waiter',       label: 'Waiter',       icon: UtensilsCrossed },
  ] as const;

  const role = $derived($page.data.user?.userType);

  // Only the sections this role can actually open. The server guards in each
  // section's +layout.server.ts remain authoritative — this just avoids showing
  // links that would bounce the user straight back.
  const visibleSections = $derived(
    sectionLinks.filter((l) => canAccessStaffSection(role, l.section))
  );

  // A single-section role (receptionist, barista, waiter) lands directly on
  // their own section, so a separate Dashboard entry would just be a redirect
  // to the page they are already on.
  const navLinks = $derived(
    visibleSections.length > 1
      ? [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }, ...visibleSections]
      : visibleSections
  );

  const isLoginPage = $derived($page.url.pathname.startsWith('/login'));

  function isActive(href: string) {
    return href === '/'
      ? $page.url.pathname === '/'
      : $page.url.pathname.startsWith(href);
  }
</script>

<Toaster />

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
      <!-- Brand -->
      <div class="px-4 py-5">
        <span class="text-sidebar-foreground font-bold text-base tracking-tight">
          El'Mariam <span class="text-accent">Staff</span>
        </span>
      </div>

      <Separator class="bg-sidebar-border" />

      <!-- Nav -->
      <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {#each navLinks as link}
          {@const active = isActive(link.href)}
          <a
            href={link.href}
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
              {active
                ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
          >
            <link.icon class="size-4 shrink-0" />
            {link.label}
          </a>
        {/each}
      </nav>

      <Separator class="bg-sidebar-border" />

      <!-- Footer -->
      <div class="px-2 py-3 space-y-0.5">
        <div class="flex items-center justify-between px-3 py-2 rounded-md">
          <span class="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <a
          href="/login"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut class="size-4" />
          Sign out
        </a>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto bg-background">
      <div class="p-6">
        {@render children()}
      </div>
    </main>
  </div>
{/if}
