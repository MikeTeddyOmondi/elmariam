<script lang="ts">
  import { getCustomers, createCustomer, type CustomerView } from '$lib/remote/hotel.remote';
  import { Button } from '@elmariam/ui';
  import { toast } from 'svelte-sonner';

  let customers: CustomerView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => {
    getCustomers()
      .then(d => { customers = d; loading = false; })
      .catch(e => { loadError = e.message; loading = false; });
  });

  let firstname    = $state('');
  let lastname     = $state('');
  let id_number    = $state('');
  let email        = $state('');
  let phone_number = $state('');
  let saving       = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    try {
      await createCustomer({ firstname, lastname, id_number, email, phone_number: phone_number || undefined });
      toast.success('Customer added.');
      firstname = ''; lastname = ''; id_number = ''; email = ''; phone_number = '';
      getCustomers().then(d => { customers = d; }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally { saving = false; }
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Customers</h1>
    <p class="text-sm text-muted-foreground mt-1">Registered hotel guests</p>
  </div>

  <!-- Create form -->
  <div class="bg-card border border-border rounded-xl p-5">
    <h2 class="text-base font-semibold text-foreground mb-4">Add Customer</h2>
    <form onsubmit={submit} class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="fname">First Name</label>
        <input id="fname" bind:value={firstname} placeholder="John" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="lname">Last Name</label>
        <input id="lname" bind:value={lastname} placeholder="Doe" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="idno">ID Number</label>
        <input id="idno" bind:value={id_number} placeholder="12345678" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="cemail">Email</label>
        <input id="cemail" type="email" bind:value={email} placeholder="john@example.com" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground" for="phone">Phone (optional)</label>
        <input id="phone" bind:value={phone_number} placeholder="+254700000000" class={inputCls} />
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Customer'}</Button>
    </form>
  </div>

  <!-- List -->
  <div class="bg-card border border-border rounded-xl overflow-hidden">
    {#if loading}
      <div class="divide-y divide-border">
        <div class="h-10 bg-secondary/50 animate-pulse rounded"></div>
        {#each Array(5) as _}
          <div class="flex gap-4 px-4 py-3">
            <div class="h-4 flex-1 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-28 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-40 bg-secondary animate-pulse rounded"></div>
            <div class="h-4 w-24 bg-secondary animate-pulse rounded"></div>
          </div>
        {/each}
      </div>
    {:else if loadError}
      <div class="p-6 text-sm text-destructive">{loadError}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-secondary/50 border-b border-border">
          <tr>
            {#each ['Name','ID Number','Email','Phone'] as h}
              <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each customers as c}
            <tr class="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td class="px-4 py-3 text-foreground font-medium">{c.firstname} {c.lastname}</td>
              <td class="px-4 py-3 text-muted-foreground font-mono text-xs">{c.id_number}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.email}</td>
              <td class="px-4 py-3 text-muted-foreground">{c.phone_number || '—'}</td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-4 py-6 text-center text-sm text-muted-foreground">No customers found</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
