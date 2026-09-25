<script lang="ts">
  import { getRooms, getRoomTypes, createRoom, type RoomView, type RoomTypeView, deleteRoom } from '$lib/remote/hotel.remote';
  import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, SelectField, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError, toastIssues, AlertDialog } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';

  let rooms: RoomView[] = $state([]);
  let roomTypes: RoomTypeView[] = $state([]);
  let loading = $state(true);
  let loadError = $state('');

  // Queries run in $effect, not at component top level: calling them eagerly
  // fetches during SSR and the result is not hydratable.
  $effect(() => {
    Promise.all([getRooms(), getRoomTypes()])
      .then(([r, rt]) => { rooms = r; roomTypes = rt; loading = false; })
      .catch((e) => { loadError = messageFor(e); loading = false; });
  });

  const roomTypeOptions = $derived(
    roomTypes.map((t) => ({ value: t.id, label: `${t.title} (${t.roomType})` }))
  );

  // Confirmed through AlertDialog rather than window.confirm().
  let pendingDelete = $state<{ id: string; label: string } | null>(null);
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Rooms</h1>
    <p class="mt-1 text-sm text-muted-foreground">Manage individual hotel rooms</p>
  </div>

  <!-- Constrained width so the form stays readable on wide screens and
       collapses to a single column on mobile. -->
  <Card class="max-w-2xl">
    <CardHeader>
      <CardTitle class="text-base">Add Room</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        {...createRoom.enhance(async ({ submit }) => {
          try {
            const ok = await submit();
            if (ok) toast.success('Room created.');
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

        <div class="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={createRoom.pending > 0}>
            <Plus />
            {createRoom.pending > 0 ? 'Saving…' : 'Add Room'}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

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
              <TableHead>Room #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each rooms as room}
              <TableRow>
                <TableCell class="font-medium text-foreground">{room.number}</TableCell>
                <TableCell>
                  <Badge variant={room.isBooked ? 'warning' : 'success'}>
                    {room.isBooked ? 'Booked' : 'Available'}
                  </Badge>
                </TableCell>
                              <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive hover:text-destructive"
                    aria-label="Delete {room.number}"
                    onclick={() => (pendingDelete = { id: room.id, label: room.number })}
                  >
                    <Trash2 />
                  </Button>
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
      </div>
    {/if}
  </Card>
</div>

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
