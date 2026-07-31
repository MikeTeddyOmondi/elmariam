<script lang="ts">
  import { getMenuItems } from '$lib/remote/catalog.remote';
  import { Card, CardContent, Skeleton, messageFor } from '@elmariam/ui';

  type MenuItem = Awaited<ReturnType<typeof getMenuItems>>[number];

  let menuItems = $state<MenuItem[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  //
  // This replaces a `+page.server.ts` load that fetched
  // `http://gateway:8009/api/public/menu` — a service removed in the rewrite —
  // and swallowed the failure in a `catch` returning an empty array, so the
  // page rendered "Menu coming soon" indefinitely.
  $effect(() => {
    getMenuItems()
      .then((d) => { menuItems = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });

  const categories = ['appetizer', 'main', 'dessert', 'beverage', 'side'] as const;

  function itemsByCategory(cat: string) {
    return menuItems.filter((item) => item.category === cat);
  }
</script>

<div class="mx-auto max-w-6xl px-8 py-12">
  <h1 class="mb-2 text-3xl font-bold text-foreground">Our Menu</h1>
  <p class="mb-10 text-muted-foreground">Fresh ingredients, expertly prepared.</p>

  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each { length: 4 } as _}
        <Card><CardContent class="space-y-2 py-5">
          <Skeleton class="h-5 w-2/3" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-4 w-1/3" />
        </CardContent></Card>
      {/each}
    </div>
  {:else if loadError}
    <p class="text-sm text-destructive">{loadError}</p>
  {:else if menuItems.length === 0}
    <p class="mt-8 text-center text-muted-foreground">Menu coming soon.</p>
  {:else}
    {#each categories as cat}
      {@const items = itemsByCategory(cat)}
      {#if items.length > 0}
        <section class="mb-10">
          <h2 class="mb-4 border-b-2 border-border pb-2 text-xl font-semibold capitalize text-foreground">
            {cat}s
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {#each items as item}
              <Card>
                <CardContent class="py-5">
                  <h3 class="mb-2 font-medium text-foreground">{item.name}</h3>
                  {#if item.description}
                    <p class="mb-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  {/if}
                  <span class="font-bold text-accent">KES {item.price?.toLocaleString()}</span>
                </CardContent>
              </Card>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  {/if}
</div>
