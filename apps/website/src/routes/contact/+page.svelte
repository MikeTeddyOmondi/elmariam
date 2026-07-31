<script lang="ts">
  import { sendContactMessage } from '$lib/remote/contact.remote';
  import {
    Button, Card, CardContent, Form, Input, Label, Textarea, toast, toastError
  } from '@elmariam/ui';
  import CheckCircle2 from 'lucide-svelte/icons/circle-check-big';
  import Send from 'lucide-svelte/icons/send';

  let sent = $state(false);
</script>

<svelte:head>
  <title>Contact Us — El'Mariam Hotel</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16">
  <h1 class="mb-2 text-3xl font-bold text-foreground">Contact Us</h1>
  <p class="mb-8 text-muted-foreground">
    We'd love to hear from you. Reach out using the details below or send us a message.
  </p>

  <Card class="mb-8">
    <CardContent class="space-y-2 py-4 text-sm">
      <div class="flex gap-3">
        <span class="w-16 flex-shrink-0 text-muted-foreground">Address</span>
        <span class="text-foreground">El'Mariam Hotel, Nairobi, Kenya</span>
      </div>
      <div class="flex gap-3">
        <span class="w-16 flex-shrink-0 text-muted-foreground">Phone</span>
        <span class="text-foreground">+254 700 000 000</span>
      </div>
      <div class="flex gap-3">
        <span class="w-16 flex-shrink-0 text-muted-foreground">Email</span>
        <span class="text-foreground">info@elmariam.co.ke</span>
      </div>
    </CardContent>
  </Card>

  <h2 class="mb-4 text-xl font-semibold text-foreground">Send a Message</h2>

  {#if sent}
    <Card>
      <CardContent class="space-y-3 py-10 text-center">
        <CheckCircle2 class="mx-auto size-10 text-emerald-500" />
        <p class="text-lg font-semibold text-foreground">Thank you for contacting us</p>
        <p class="text-sm text-muted-foreground">
          We've received your message and will reach out to you soon.
        </p>
        <Button variant="outline" onclick={() => (sent = false)}>Send another message</Button>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="py-6">
        <!--
          Previously a `// placeholder` that just set `sent = true` without
          sending anything. It now publishes to the `mails` queue, which the
          SMTP consumer forwards to the business inbox.
        -->
        <form
          {...sendContactMessage.enhance(async ({ submit }) => {
            try {
              // `submit()` resolves false on validation issues; it does not throw.
              const ok = await submit();
              if (ok) {
                sent = true;
                toast.success('Message sent.');
              }
            } catch (e) {
              toastError(e);
            }
          })}
          class="space-y-4"
        >
          <Form.Message issues={sendContactMessage.fields.issues?.()} />

          <Form.Field>
            <Label for="name">Name</Label>
            <Input id="name" placeholder="Your name" {...sendContactMessage.fields.name.as('text')} />
            <Form.FieldErrors issues={sendContactMessage.fields.name.issues()} />
          </Form.Field>

          <Form.Field>
            <Label for="email">Email</Label>
            <Input id="email" placeholder="your@email.com" {...sendContactMessage.fields.email.as('email')} />
            <Form.FieldErrors issues={sendContactMessage.fields.email.issues()} />
          </Form.Field>

          <Form.Field>
            <Label for="message">Message</Label>
            <Textarea
              id="message"
              rows={5}
              placeholder="Your message…"
              class="resize-none"
              {...sendContactMessage.fields.message.as('text')}
            />
            <Form.FieldErrors issues={sendContactMessage.fields.message.issues()} />
          </Form.Field>

          <Button type="submit" class="w-full" disabled={sendContactMessage.pending > 0}>
            <Send />
            {sendContactMessage.pending > 0 ? 'Sending…' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  {/if}
</div>
