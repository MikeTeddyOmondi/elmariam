<script lang="ts">
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  const tabs = [
    { href: '/waiter',        label: 'Overview' },
    { href: '/waiter/menu',   label: 'Menu' },
    { href: '/waiter/orders', label: 'Orders' },
  ];

  function isActive(href: string) {
    return href === '/waiter'
      ? $page.url.pathname === '/waiter'
      : $page.url.pathname.startsWith(href);
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Waiter</h1>
    <p class="text-sm text-muted-foreground mt-0.5">Restaurant service operations</p>
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
