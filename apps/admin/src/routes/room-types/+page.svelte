<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getRoomTypes, createRoomType, updateRoomType, type RoomTypeView, deleteRoomType } from '$lib/remote/hotel.remote';
  import {
    Button, Card, CardContent, Dialog, Form, Input, Label, SelectField, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import { can } from '$lib/permissions';

  let roomTypes: RoomTypeView[] = $state([]);
  let loading = $state(true);

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Editing happens in a modal. Only one room type is open at a time.
  let editingId = $state<string | null>(null);
  const editing = $derived(roomTypes.find((t) => t.id === editingId) ?? null);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    getRoomTypes()
      .then((d) => { roomTypes = d; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
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
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Room Types</h1>
      <p class="mt-1 text-sm text-muted-foreground">Rates and capacity per room category</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <Plus />
        Add Room Type
      </Button>
    {/if}
  </div>

  <Card class="overflow-hidden">
    {#if loading}
      <CardContent class="space-y-3 py-6">
        {#each { length: 5 } as _}
          <Skeleton class="h-5 w-full" />
        {/each}
      </CardContent>
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
            {#each roomTypes.slice((__page - 1) * __perPage, __page * __perPage) as rt}
              <TableRow>
                <TableCell class="font-medium text-foreground">{rt.title}</TableCell>
                <TableCell class="capitalize text-muted-foreground">{rt.roomType}</TableCell>
                <TableCell class="text-right text-muted-foreground">KES {rt.rate?.toLocaleString()}</TableCell>
                <TableCell class="text-right text-muted-foreground">{rt.capacity}</TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-1">
                    {#if canWrite}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit {rt.title}"
                        onclick={() => (editingId = rt.id)}
                      >
                        <Pencil />
                      </Button>
                    {/if}
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
                  </div>
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
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={roomTypes.length} perPage={__perPage} label="room types" />
      </div>
      </div>
    {/if}
  </Card>
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="Add Room Type"
    description="Define a room category, its rate and capacity."
    pending={createRoomType.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <form
      {...createRoomType.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Room type created.');
            showCreate = false;
          }
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

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={createRoomType.pending > 0}
          onclick={() => (showCreate = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createRoomType.pending > 0}>
          <Plus />
          {createRoomType.pending > 0 ? 'Saving…' : 'Add Room Type'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

{#if canWrite && editing}
  {@const rt = editing}
  {@const editForm = updateRoomType.for(rt.id)}
  <Dialog
    open={true}
    title="Edit Room Type"
    description="Update {rt.title}."
    pending={editForm.pending > 0}
    onclose={() => (editingId = null)}
  >
    <form
      {...editForm.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Room type updated.');
            editingId = null;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={rt.id} />

      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={editForm.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="et-{rt.id}">Title</Label>
        <Input id="et-{rt.id}" {...editForm.fields.title.as('text', rt.title)} />
        <Form.FieldErrors issues={editForm.fields.title.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="ety-{rt.id}">Type</Label>
        <SelectField
          id="ety-{rt.id}"
          items={ROOM_TYPE_OPTIONS}
          {...editForm.fields.roomType.as('select', rt.roomType)}
        />
        <Form.FieldErrors issues={editForm.fields.roomType.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="erate-{rt.id}">Rate / Night (KES)</Label>
        <Input id="erate-{rt.id}" min="0" step="0.01" {...editForm.fields.rate.as('number', rt.rate)} />
        <Form.FieldErrors issues={editForm.fields.rate.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="ecap-{rt.id}">Capacity</Label>
        <Input id="ecap-{rt.id}" min="1" {...editForm.fields.capacity.as('number', rt.capacity)} />
        <Form.FieldErrors issues={editForm.fields.capacity.issues()} />
      </Form.Field>

      <Form.Field class="sm:col-span-2">
        <Label for="edesc-{rt.id}">Description</Label>
        <Input id="edesc-{rt.id}" {...editForm.fields.description.as('text', rt.description)} />
        <Form.FieldErrors issues={editForm.fields.description.issues()} />
      </Form.Field>

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={editForm.pending > 0} onclick={() => (editingId = null)}>
          Cancel
        </Button>
        <Button type="submit" disabled={editForm.pending > 0}>
          {editForm.pending > 0 ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

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
