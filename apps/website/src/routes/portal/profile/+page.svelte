<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getMyProfile, saveMyProfile } from '$lib/remote/account.remote';
  import {
    Button, Card, CardContent, Form, Input, Label, Separator, Skeleton, toast, toastError
  } from '@elmariam/ui';
  import UserPen from 'lucide-svelte/icons/user-pen';

  let profile = $state<Awaited<ReturnType<typeof getMyProfile>>>(null);
  let loading = $state(true);
  let editing = $state(false);

  // Where to go after saving, e.g. back to the booking that sent them here.
  // Only portal paths, so the parameter cannot be used as an open redirect.
  const next = $derived.by(() => {
    const n = page.url.searchParams.get('next');
    return n && n.startsWith('/portal/') ? n : null;
  });

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getMyProfile()
      .then((d) => { profile = d; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  const showForm = $derived(!loading && (!profile || editing));
</script>

<h1 class="mb-6 text-2xl font-bold text-foreground">My Profile</h1>

<Card class="max-w-md">
  <CardContent class="py-6">
    {#if loading}
      <div class="space-y-4">
        {#each { length: 4 } as _, i (i)}
          <Skeleton class="h-5 w-full" />
        {/each}
      </div>
    {:else if showForm}
      {#if !profile}
        <div class="mb-5 flex gap-3">
          <UserPen class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            We need a few details before you can make a booking. Your ID number is used to
            check you in and cannot be changed later.
          </p>
        </div>
      {/if}

      <form
        {...saveMyProfile.enhance(async ({ submit }) => {
          try {
            // `submit()` resolves to false on validation issues; it does not throw.
            const ok = await submit();
            if (!ok) return;
            // From the form's own result. Awaiting `getMyProfile()` here would
            // fail: an event handler is not a reactive context.
            profile = saveMyProfile.result?.profile ?? profile;
            editing = false;
            toast.success('Profile saved.');
            if (next) await goto(next);
          } catch (e) {
            toastError(e);
          }
        })}
        class="flex flex-col gap-4"
      >
        <Form.Message issues={saveMyProfile.fields.allIssues()} />

        <div class="grid gap-4 sm:grid-cols-2">
          <Form.Field>
            <Label for="firstname">First name</Label>
            <Input
              id="firstname"
              autocomplete="given-name"
              {...saveMyProfile.fields.firstname.as('text', profile?.firstname ?? '')}
            />
            <Form.FieldErrors issues={saveMyProfile.fields.firstname.issues()} />
          </Form.Field>

          <Form.Field>
            <Label for="lastname">Last name</Label>
            <Input
              id="lastname"
              autocomplete="family-name"
              {...saveMyProfile.fields.lastname.as('text', profile?.lastname ?? '')}
            />
            <Form.FieldErrors issues={saveMyProfile.fields.lastname.issues()} />
          </Form.Field>
        </div>

        {#if !profile}
          <Form.Field>
            <Label for="id_number">National ID or passport number</Label>
            <Input id="id_number" {...saveMyProfile.fields.id_number.as('text')} />
            <Form.FieldErrors issues={saveMyProfile.fields.id_number.issues()} />
          </Form.Field>
        {/if}

        <Form.Field>
          <Label for="phone_number">Mobile number</Label>
          <Input
            id="phone_number"
            autocomplete="tel"
            placeholder="0712 345 678"
            {...saveMyProfile.fields.phone_number.as('tel', profile?.phone_number ? `0${String(profile.phone_number).slice(3)}` : '')}
          />
          <p class="text-xs text-muted-foreground">Used for M-Pesa payments and booking SMS.</p>
          <Form.FieldErrors issues={saveMyProfile.fields.phone_number.issues()} />
        </Form.Field>

        <div class="flex justify-end gap-2">
          {#if profile}
            <Button type="button" variant="outline" onclick={() => (editing = false)}>Cancel</Button>
          {/if}
          <Button type="submit" disabled={saveMyProfile.pending > 0}>
            {saveMyProfile.pending > 0 ? 'Saving…' : profile ? 'Save changes' : next ? 'Save and continue' : 'Save profile'}
          </Button>
        </div>
      </form>
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
          <dd class="font-medium text-foreground">{profile.phone_number || '-'}</dd>
        </div>
      </dl>
      <div class="mt-4 flex justify-end">
        <Button variant="outline" onclick={() => (editing = true)}><UserPen /> Edit profile</Button>
      </div>
    {/if}
  </CardContent>
</Card>
