<script lang="ts">
  import { createCustomer } from '$lib/remote/hotel.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let firstname = $state('');
  let lastname = $state('');
  let id_number = $state('');
  let email = $state('');
  let phone_number = $state('');
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    try {
      await createCustomer({ firstname, lastname, id_number, email, phone_number: phone_number || undefined });
      toast.success('Customer created successfully.');
      firstname = lastname = id_number = email = phone_number = '';
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  }
</script>

<div class="space-y-6 max-w-lg">
  <div>
    <a href="/receptionist/customers" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</a>
    <h1 class="text-2xl font-bold text-foreground mt-2">New Customer</h1>
  </div>

  <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="first">First Name</label>
        <input id="first" bind:value={firstname} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="last">Last Name</label>
        <input id="last" bind:value={lastname} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="idnum">ID Number</label>
      <input id="idnum" bind:value={id_number} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="email">Email</label>
      <input id="email" type="email" bind:value={email} required class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm text-muted-foreground" for="phone">Phone <span class="text-xs">(optional)</span></label>
      <input id="phone" bind:value={phone_number} class="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
    </div>
    <Button type="submit" class="w-full">Create Customer</Button>
  </form>
</div>
