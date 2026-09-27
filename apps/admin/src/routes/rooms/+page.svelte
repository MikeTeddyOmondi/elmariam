<script lang="ts">
  import { Pagination } from '@elmariam/ui';
  let __page = $state(1);
  const __perPage = 20;
  import { getRooms, getRoomTypes, createRoom, updateRoom, type RoomView, type RoomTypeView, deleteRoom } from '$lib/remote/hotel.remote';
  import {
    Badge, Button, Card, CardContent, Dialog, Form, Input, Label, SelectField, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import { can } from '$lib/permissions';

  let rooms: RoomView[] = $state([]);
  let roomTypes: RoomTypeView[] = $state([]);
  let loading = $state(true);

  // Create lives in a modal opened from the header, not a card above the table.
  let showCreate = $state(false);

  // Editing happens in a modal. Only one room is open at a time.
  let editingId = $state<string | null>(null);
  const editing = $derived(rooms.find((r) => r.id === editingId) ?? null);

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    Promise.all([getRooms(), getRoomTypes()])
      .then(([r, rt]) => { rooms = r; roomTypes = rt; loading = false; })
      .catch((e) => { toastError(e); loading = false; });
  });

  const roomTypeOptions = $derived(
    roomTypes.map((t) => ({ value: t.id, label: `${t.title} (${t.roomType})` }))
  );

  // Confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<{ id: string; label: string } | null>(null);

  // Cosmetic gating only: every remote function guards itself with
  // `requirePermission`, so a read-only role that posts directly still gets a
  // 403. This keeps `management` from seeing controls that could only fail.
  const canWrite = $derived(can('rooms:write'));
  const canDelete = $derived(can('rooms:delete'));
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Rooms</h1>
      <p class="mt-1 text-sm text-muted-foreground">Manage individual hotel rooms</p>
    </div>
    {#if canWrite}
      <Button onclick={() => (showCreate = true)}>
        <Plus />
        Add Room
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
              <TableHead>Room #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each rooms.slice((__page - 1) * __perPage, __page * __perPage) as room}
              <TableRow>
                <TableCell class="font-medium text-foreground">{room.number}</TableCell>
                <TableCell>
                  <Badge variant={room.isBooked ? 'warning' : 'success'}>
                    {room.isBooked ? 'Booked' : 'Available'}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-1">
                    {#if canWrite}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit {room.number}"
                        onclick={() => (editingId = room.id)}
                      >
                        <Pencil />
                      </Button>
                    {/if}
                    {#if canDelete}
                      <Button
                        variant="ghost"
                        size="icon"
                        class="text-destructive hover:text-destructive"
                        aria-label="Delete {room.number}"
                        onclick={() => (pendingDelete = { id: room.id, label: room.number })}
                      >
                        <Trash2 />
                      </Button>
                    {/if}
                  </div>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={3} class="py-6 text-center text-muted-foreground">
                  No rooms found
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      <div class="px-4 py-3">
        <Pagination bind:page={__page} total={rooms.length} perPage={__perPage} label="rooms" />
      </div>
      </div>
    {/if}
  </Card>
</div>

{#if canWrite}
  <Dialog
    open={showCreate}
    title="Add Room"
    description="Register a new hotel room."
    pending={createRoom.pending > 0}
    onclose={() => (showCreate = false)}
  >
    <form
      {...createRoom.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Room created.');
            showCreate = false;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <div class="sm:col-span-2 empty:hidden">
        <Form.Message issues={createRoom.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="rnumber">Room Number</Label>
        <Input id="rnumber" placeholder="e.g. 101" {...createRoom.fields.number.as('text')} />
        <Form.FieldErrors issues={createRoom.fields.number.issues()} />
      </Form.Field>

      <Form.Field>
        <Label for="rtype">Room Type</Label>
        <SelectField
          id="rtype"
          disabled={loading}
          items={roomTypeOptions}
          placeholder={loading ? 'Loading' : 'Select type'}
          {...createRoom.fields.roomTypeId.as('select')}
        />
        <Form.FieldErrors issues={createRoom.fields.roomTypeId.issues()} />
      </Form.Field>

      <div class="sm:col-span-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={createRoom.pending > 0}
          onclick={() => (showCreate = false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createRoom.pending > 0}>
          <Plus />
          {createRoom.pending > 0 ? 'Saving…' : 'Add Room'}
        </Button>
      </div>
    </form>
  </Dialog>
{/if}

{#if canWrite && editing}
  {@const room = editing}
  {@const editForm = updateRoom.for(room.id)}
  <Dialog
    open={true}
    title="Edit Room"
    description="Update room {room.number}."
    pending={editForm.pending > 0}
    onclose={() => (editingId = null)}
  >
    <form
      {...editForm.enhance(async ({ submit }) => {
        try {
          const ok = await submit();
          if (ok) {
            toast.success('Room updated.');
            editingId = null;
          }
        } catch (e) {
          toastError(e);
        }
      })}
      class="grid gap-4"
    >
      <input type="hidden" name="id" value={room.id} />

      <div class="empty:hidden">
        <Form.Message issues={editForm.fields.allIssues()} />
      </div>

      <Form.Field>
        <Label for="ern-{room.id}">Room Number</Label>
        <Input id="ern-{room.id}" {...editForm.fields.number.as('text', room.number)} />
        <Form.FieldErrors issues={editForm.fields.number.issues()} />
      </Form.Field>

      <div class="flex justify-end gap-2">
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
  {@const deleteForm = deleteRoom.for(target.id)}
  <form
    id="delete-room-form"
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
    title="Delete this room?"
    description="{target.label} will be removed. This cannot be undone."
    confirmLabel={deleteForm.pending > 0 ? 'Deleting' : 'Delete'}
    destructive
    pending={deleteForm.pending > 0}
    confirmForm="delete-room-form"
    onclose={() => (pendingDelete = null)}
  />
{/if}
