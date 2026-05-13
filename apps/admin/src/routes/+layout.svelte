<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import { Separator } from '@elmariam/ui';
  import {
    LayoutDashboard, Users, UserCheck, CalendarDays, BedDouble,
    Layers, GlassWater, ShoppingCart, BarChart3, UtensilsCrossed,
    ClipboardList, LogOut,
  } from 'lucide-svelte';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  const navLinks = [
    { href: '/',                  label: 'Dashboard',         icon: LayoutDashboard },
    { href: '/users',             label: 'Users',             icon: Users },
    { href: '/customers',         label: 'Customers',         icon: UserCheck },
    { href: '/bookings',          label: 'Bookings',          icon: CalendarDays },
    { href: '/rooms',             label: 'Rooms',             icon: BedDouble },
    { href: '/room-types',        label: 'Room Types',        icon: Layers },
    { href: '/bar-drinks',        label: 'Bar Drinks',        icon: GlassWater },
    { href: '/bar-purchases',     label: 'Bar Purchases',     icon: ShoppingCart },
    { href: '/bar-sales',         label: 'Bar Sales',         icon: BarChart3 },
    { href: '/menu-items',        label: 'Menu Items',        icon: UtensilsCrossed },
    { href: '/restaurant-orders', label: 'Restaurant Orders', icon: ClipboardList },
  ];

  const isLoginPage = $derived($page.url.pathname.startsWith('/login'));

  function isActive(href: string) {
    return href === '/'
      ? $page.url.pathname === '/'
      : $page.url.pathname.startsWith(href);
  }
</script>

{#if isLoginPage}
  {@render children()}
{:else}
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-60 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
      <!-- Brand -->
      <div class="px-4 py-5">
        <span class="text-sidebar-foreground font-bold text-base tracking-tight">
          El'Mariam <span class="text-accent">Admin</span>
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
            <link.icon class="size-4 flex-shrink-0" />
            {link.label}
          </a>
        {/each}
      </nav>

      <Separator class="bg-sidebar-border" />

      <!-- Footer -->
      <div class="px-2 py-3">
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
