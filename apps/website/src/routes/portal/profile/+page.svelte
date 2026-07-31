<script lang="ts">
  import { getMyProfile } from '$lib/remote/account.remote';
  import { Button, Card, CardContent, Separator, Skeleton, messageFor } from '@elmariam/ui';
  import UserPen from 'lucide-svelte/icons/user-pen';

  let profile = $state<Awaited<ReturnType<typeof getMyProfile>>>(null);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMyProfile()
      .then((d) => { profile = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });
</script>

<h1 class="mb-6 text-2xl font-bold text-foreground">My Profile</h1>

<Card class="max-w-md">
  <CardContent class="py-6">
    {#if loading}
      <div class="space-y-4">
        {#each { length: 4 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </div>
    {:else if loadError}
      <p class="text-sm text-destructive">{loadError}</p>
    {:else if profile}
      <dl class="text-sm">
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Name</dt>
          <dd class="font-medium text-foreground">{profile.firstname} {profile.lastname}</dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Email</dt>
          <dd class="font-medium text-foreground">{profile.email}</dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">ID Number</dt>
          <dd class="font-medium text-foreground">{profile.id_number}</dd>
        </div>
        <Separator />
        <div class="flex items-center justify-between py-2">
          <dt class="text-muted-foreground">Phone</dt>
          <dd class="font-medium text-foreground">{profile.phone_number || '—'}</dd>
        </div>
      </dl>
    {:else}
      <div class="space-y-4 text-center">
        <UserPen class="mx-auto size-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          You haven't set up your profile yet. We need a few details before you can make a booking.
        </p>
        <Button disabled>Complete profile (coming soon)</Button>
      </div>
    {/if}
  </CardContent>
</Card>
