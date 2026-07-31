<script lang="ts">
  import { getRooms, getRoomTypes, createRoom, type RoomView, type RoomTypeView } from '$lib/remote/hotel.remote';
  import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, Form, Input, Label, Select, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    messageFor, toast, toastError
  } from '@elmariam/ui';
  import Plus from 'lucide-svelte/icons/plus';

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
          <Form.Message issues={createRoom.fields.issues?.()} />
        </div>

        <Form.Field>
          <Label for="rnumber">Room Number</Label>
          <Input id="rnumber" placeholder="e.g. 101" {...createRoom.fields.number.as('text')} />
          <Form.FieldErrors issues={createRoom.fields.number.issues()} />
        </Form.Field>

        <Form.Field>
          <Label for="rtype">Room Type</Label>
          <Select id="rtype" disabled={loading} {...createRoom.fields.roomTypeId.as('select')}>
            <option value="">{loading ? 'Loading…' : 'Select type'}</option>
            {#each roomTypes as t}
              <option value={t.id}>{t.title} ({t.roomType})</option>
            {/each}
          </Select>
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
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan={2} class="py-6 text-center text-muted-foreground">
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
