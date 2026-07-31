<script lang="ts">
  import { createCustomer } from '$lib/remote/hotel.remote';
  import { Button, Card, CardContent, Form, Input, Label, toast, toastError } from '@elmariam/ui';
  import UserPlus from 'lucide-svelte/icons/user-plus';
</script>

<div class="max-w-lg space-y-6">
  <div>
    <a href="/receptionist/customers" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
      ← Back
    </a>
    <h1 class="mt-2 text-2xl font-bold text-foreground">New Customer</h1>
  </div>

  <Card>
    <CardContent class="py-6">
      <form
        {...createCustomer.enhance(async ({ submit }) => {
          try {
            // `submit()` resolves false on validation issues; it does not throw.
            const ok = await submit();
            if (ok) toast.success('Customer created.');
          } catch (e) {
            toastError(e);
          }
        })}
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="sm:col-span-2 empty:hidden">
          <Form.Message issues={createCustomer.fields.issues?.()} />
        </div>

        <Form.Field>
          <Label for="first">First Name</Label>
          <Input id="first" placeholder="John" {...createCustomer.fields.firstname.as('text')} />
          <Form.FieldErrors issues={createCustomer.fields.firstname.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="last">Last Name</Label>
          <Input id="last" placeholder="Doe" {...createCustomer.fields.lastname.as('text')} />
          <Form.FieldErrors issues={createCustomer.fields.lastname.issues()} />
        </Form.Field>

        <Form.Field class="sm:col-span-2">
          <Label for="idnum">ID Number</Label>
          <Input id="idnum" placeholder="12345678" {...createCustomer.fields.id_number.as('text')} />
          <Form.FieldErrors issues={createCustomer.fields.id_number.issues()} />
        </Form.Field>

        <Form.Field class="sm:col-span-2">
          <Label for="email">Email</Label>
          <Input id="email" placeholder="john@example.com" {...createCustomer.fields.email.as('email')} />
          <Form.FieldErrors issues={createCustomer.fields.email.issues()} />
        </Form.Field>

        <Form.Field class="sm:col-span-2">
          <Label for="phone">Phone <span class="text-muted-foreground">(optional)</span></Label>
          <Input id="phone" placeholder="+254700000000" {...createCustomer.fields.phone_number.as('tel')} />
          <Form.FieldErrors issues={createCustomer.fields.phone_number.issues()} />
        </Form.Field>

        <div class="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={createCustomer.pending > 0}>
            <UserPlus />
            {createCustomer.pending > 0 ? 'Saving…' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
