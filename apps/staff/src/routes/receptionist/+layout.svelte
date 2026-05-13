<script lang="ts">
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  const tabs = [
    { href: '/receptionist',           label: 'Overview' },
    { href: '/receptionist/customers', label: 'Customers' },
    { href: '/receptionist/bookings',  label: 'Bookings' },
    { href: '/receptionist/rooms',     label: 'Rooms' },
    { href: '/receptionist/invoices',  label: 'Invoices' },
  ];

  function isActive(href: string) {
    return href === '/receptionist'
      ? $page.url.pathname === '/receptionist'
      : $page.url.pathname.startsWith(href);
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Receptionist</h1>
    <p class="text-sm text-muted-foreground mt-0.5">Front-desk operations</p>
  </div>

  <div class="border-b border-border">
    <nav class="flex gap-0 -mb-px overflow-x-auto">
      {#each tabs as tab}
        {@const active = isActive(tab.href)}
        <a
          href={tab.href}
          class="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
            {active
              ? 'border-accent text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
        >{tab.label}</a>
      {/each}
    </nav>
  </div>

  {@render children()}
</div>
