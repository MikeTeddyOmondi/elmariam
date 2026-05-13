<script lang="ts">
  import { Button, Alert, AlertDescription } from '@elmariam/ui';

  let name = $state('');
  let email = $state('');
  let message = $state('');
  let sent = $state(false);

  function submit(e: SubmitEvent) {
    e.preventDefault();
    // placeholder — wire to API when available
    sent = true;
  }

  const inputCls = 'w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors';
</script>

<svelte:head>
  <title>Contact Us — El'Mariam Hotel</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-16">
  <h1 class="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
  <p class="text-muted-foreground mb-8">
    We'd love to hear from you. Reach out using the details below or send us a message.
  </p>

  <!-- Contact info -->
  <div class="bg-card border border-border rounded-xl px-5 py-4 mb-8 space-y-2 text-sm">
    <div class="flex gap-3">
      <span class="text-muted-foreground w-16 flex-shrink-0">Address</span>
      <span class="text-foreground">El'Mariam Hotel, Nairobi, Kenya</span>
    </div>
    <div class="flex gap-3">
      <span class="text-muted-foreground w-16 flex-shrink-0">Phone</span>
      <span class="text-foreground">+254 700 000 000</span>
    </div>
    <div class="flex gap-3">
      <span class="text-muted-foreground w-16 flex-shrink-0">Email</span>
      <span class="text-foreground">info@elmariam.co.ke</span>
    </div>
  </div>

  <!-- Contact form -->
  <h2 class="text-xl font-semibold text-foreground mb-4">Send a Message</h2>

  {#if sent}
    <Alert>
      <AlertDescription class="text-green-500">
        Your message has been sent — we'll get back to you shortly.
      </AlertDescription>
    </Alert>
  {:else}
    <form onsubmit={submit} class="bg-card border border-border rounded-xl p-6 space-y-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="name">Name</label>
        <input id="name" type="text" bind:value={name} placeholder="Your name" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="email">Email</label>
        <input id="email" type="email" bind:value={email} placeholder="your@email.com" required class={inputCls} />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm text-muted-foreground" for="message">Message</label>
        <textarea id="message" bind:value={message} rows="5" placeholder="Your message…" required
          class="{inputCls} resize-none"></textarea>
      </div>
      <Button type="submit" class="w-full">Send Message</Button>
    </form>
  {/if}
</div>
