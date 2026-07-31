<script lang="ts">
  import { getRoomTypes } from '$lib/remote/catalog.remote';
  import { Badge, Button, Card, CardContent, Skeleton, messageFor } from '@elmariam/ui';

  type RoomType = Awaited<ReturnType<typeof getRoomTypes>>[number];

  let roomTypes = $state<RoomType[]>([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  //
  // This replaces a `+page.server.ts` load that fetched
  // `http://gateway:8009/api/public/roomtypes` — a service removed in the
  // rewrite — and swallowed the failure in a `catch` returning an empty array,
  // so the page rendered "No room types available" indefinitely.
  $effect(() => {
    getRoomTypes()
      .then((d) => { roomTypes = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<div class="mx-auto max-w-6xl px-8 py-12">
  <h1 class="mb-2 text-3xl font-bold text-foreground">Our Rooms</h1>
  <p class="mb-8 text-muted-foreground">All rooms are fully furnished with modern amenities.</p>

  {#if loading}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each { length: 3 } as _}
        <Card><CardContent class="space-y-3 py-6">
          <Skeleton class="h-4 w-20" />
          <Skeleton class="h-6 w-3/4" />
          <Skeleton class="h-16 w-full" />
          <Skeleton class="h-10 w-full" />
        </CardContent></Card>
      {/each}
    </div>
  {:else if loadError}
    <p class="text-sm text-destructive">{loadError}</p>
  {:else if roomTypes.length === 0}
    <p class="mt-8 text-center text-muted-foreground">No room types available at this time.</p>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each roomTypes as rt}
        <Card class="flex flex-col">
          <CardContent class="flex flex-1 flex-col gap-3 py-6">
            <Badge variant="secondary" class="w-fit uppercase tracking-widest">{rt.roomType}</Badge>
            <h2 class="text-xl font-semibold text-foreground">{rt.title}</h2>
            <p class="flex-1 text-sm leading-relaxed text-muted-foreground">{rt.description}</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Capacity: {rt.capacity} guests</span>
              <span class="font-bold text-foreground">KES {rt.rate?.toLocaleString()} / night</span>
            </div>
            <Button href="/login" class="w-full">Book This Room</Button>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
