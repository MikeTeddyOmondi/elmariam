<script lang="ts">
  import { getRoomTypes, createRoomType, type RoomTypeView, deleteRoomType } from '$lib/remote/hotel.remote';
  import {
    Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, SelectField, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import { can } from '$lib/permissions';

  let roomTypes: RoomTypeView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getRoomTypes()
      .then((d) => { roomTypes = d; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });

  const ROOM_TYPE_OPTIONS = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' }
  ];

  // Confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<{ id: string; label: string } | null>(null);

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('roomtypes:write'));
  const canDelete = $derived(can('roomtypes:delete'));
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Room Types</h1>
    <p class="mt-1 text-sm text-muted-foreground">Rates and capacity per room category</p>
  </div>

  {#if canWrite}
    <Card class="max-w-2xl">
      <CardHeader>
        <CardTitle class="text-base">Add Room Type</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          {...createRoomType.enhance(async ({ submit }) => {
            try {
              const ok = await submit();
              if (ok) toast.success('Room type created.');
            } catch (e) {
              toastError(e);
            }
          })}
          class="grid gap-4 sm:grid-cols-2"
        >
          <div class="sm:col-span-2 empty:hidden">
            <Form.Message issues={createRoomType.fields.allIssues()} />
          </div>

          <Form.Field>
            <Label for="rttitle">Title</Label>
            <Input id="rttitle" placeholder="e.g. Deluxe Single" {...createRoomType.fields.title.as('text')} />
            <Form.FieldErrors issues={createRoomType.fields.title.issues()} />
          </Form.Field>

          <Form.Field>
            <Label for="rttype">Type</Label>
            <SelectField
              id="rttype"
              items={ROOM_TYPE_OPTIONS}
              {...createRoomType.fields.roomType.as('select', 'single')}
            />
            <Form.FieldErrors issues={createRoomType.fields.roomType.issues()} />
          </Form.Field>

          <Form.Field>
            <Label for="rtrate">Rate / Night (KES)</Label>
            <Input id="rtrate" min="0" step="0.01" {...createRoomType.fields.rate.as('number')} />
            <Form.FieldErrors issues={createRoomType.fields.rate.issues()} />
          </Form.Field>

          <Form.Field>
            <Label for="rtcap">Capacity</Label>
            <Input id="rtcap" min="1" {...createRoomType.fields.capacity.as('number')} />
            <Form.FieldErrors issues={createRoomType.fields.capacity.issues()} />
          </Form.Field>

          <Form.Field class="sm:col-span-2">
            <Label for="rtdesc">Description</Label>
            <Input id="rtdesc" placeholder="Brief description…" {...createRoomType.fields.description.as('text')} />
            <Form.FieldErrors issues={createRoomType.fields.description.issues()} />
          </Form.Field>

          <div class="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={createRoomType.pending > 0}>
              <Plus />
              {createRoomType.pending > 0 ? 'Saving…' : 'Add Room Type'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  {/if}

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
    {:else if loadError}
      <CardContent class="py-6 text-sm text-destructive">{loadError}</CardContent>
    {:else}
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead class="text-right">Rate</TableHead>
              <TableHead class="text-right">Capacity</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each roomTypes as rt}
              <TableRow>
                <TableCell class="font-medium text-foreground">{rt.title}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{rt.roomType}</TableCell>
                <TableCell class="text-right text-muted-foreground">KES {rt.rate?.toLocaleString()}</TableCell>
                <TableCell class="text-right text-muted-foreground">{rt.capacity}</TableCell>
                <TableCell class="text-right">
                  {#if canDelete}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive hover:text-destructive"
                      aria-label="Delete {rt.title}"
                      onclick={() => (pendingDelete = { id: rt.id, label: rt.title })}
                    >
                      <Trash2 />
                    </Button>
                  {/if}
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={5} class="py-6 text-center text-muted-foreground">
                  No room types found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </Card>
</div>

{#if pendingDelete}
  {@const target = pendingDelete}
  {@const deleteForm = deleteRoomType.for(target.id)}
  <form
    id="delete-roomtype-form"
    {...deleteForm.enhance(async ({ submit }) => {
      try {
        const ok = await submit();
        if (ok) {
          toast.success(`${target.label} deleted.`);
          pendingDelete = null;
        } else {
          // A refused delete (a dependant exists) comes back as a form-level
          // issue. The hidden delete form has nowhere to render it, so without
          // this the dialog just sits there saying nothing.
          toastIssues(deleteForm.fields.allIssues());
        }
      } catch (e) {
        toastError(e);
      }
    })}
  >
    <input type="hidden" name="id" value={target.id} />
  </form>

  <AlertDialog
    open={true}
    title="Delete this room type?"
    description="{target.label} will be removed. This cannot be undone."
    confirmLabel={deleteForm.pending > 0 ? 'Deleting' : 'Delete'}
    destructive
    pending={deleteForm.pending > 0}
    confirmForm="delete-roomtype-form"
    onclose={() => (pendingDelete = null)}
  />
{/if}
