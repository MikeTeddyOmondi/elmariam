<script>
  import axios from "axios";
  import { onMount } from "svelte";
  import { roomStore } from "../stores/hotelStore";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";
  import { link } from "svelte-spa-router";

  // @ts-ignore
  let roomTypes = [];
  let numEntries = $roomStore.length;
  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  onMount(async () => {
    const roomsFetchResponse = await axiosInstance.get("/hotel/rooms");
    let allRooms = roomsFetchResponse.data.data.rooms;
    roomStore.update(() => [...allRooms]);

    const roomTypesFetchResponse = await axiosInstance.get("/hotel/roomtypes");
    roomTypes = roomTypesFetchResponse.data.data.roomTypes;
  });

  let roomNumber = "";
  let roomTypeSelected = "";

  // @ts-ignore
  $: roomTypes;

  $: submit = async () => {
    if (roomNumber === "") {
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: "Please enter a room number!",
      };
      return;
    }

    if (roomTypeSelected === "") {
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: "Please enter a room type!",
      };
      return;
    }

    const response = await axiosInstance.post(
      `/hotel/rooms/${roomTypeSelected}`,
      {
        number: roomNumber.toUpperCase(),
      }
    );

    // @ts-ignore
    if (response.name) {
      let resData = await response.response.data.data;
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: resData.message,
      };
      return;
    }

    if (response.status === 200) {
      console.log({ resData: await response.data.data });
      let room = await response.data.data;

      toastProps = {
        isErr: false,
        isSucc: true,
        toastMsg: `Room number ${room.number} created successfully!`,
      };

      roomStore.update((currentData) => {
        return [...currentData, room];
      });

      roomNumber = "";
      roomTypeSelected = "";
    }
  };
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Rooms</h1>
      <button class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
        <i class="fas fa-download fa-sm text-white-50" />
        Export
      </button>
    </div>

    <!-- Add Users Form -->
    <Toast {toastProps} />
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Add Rooms</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-xl-12 col-md-12 mb-4">
            <form on:submit|preventDefault={submit} autocomplete="off">
              <div class="form-group">
                <label for="number">Room Number:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="number"
                  id="number"
                  autocomplete="off"
                  bind:value={roomNumber}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="roomType">Room Type:</label>
                <select
                  class="w-100 form-control"
                  bind:value={roomTypeSelected}
                  on:focus={() => (toastProps.isErr = false)}
                >
                  {#each roomTypes as rt}
                    {#if rt.roomType === "single"}
                      <option value={rt._id}>{rt.roomType}</option>
                    {:else if rt.roomType === "double"}
                      <option value={rt._id}>{rt.roomType}</option>
                    {/if}
                  {/each}
                </select>
              </div>
              <hr />
              <input
                type="submit"
                class="btn btn-primary shadow-sm w-100"
                value="Submit"
              />
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- All Users Table -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">All Rooms</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <div class="dataTables_wrapper dt-bootstrap4">
            <div class="row">
              <div class="col-sm-12 col-md-6">
                <div class="dataTables_length">
                  Show:
                  <label>
                    <select
                      name="dataTable_length"
                      aria-controls="dataTable"
                      class="custom-select custom-select-sm form-control form-control-sm"
                    >
                      <option value="{numEntries}">{numEntries}</option>
                    </select>
                  </label>
                  entries
                </div>
              </div>
              <div class="col-sm-6 px-3">
                <div class="dataTables_length">
                  <input
                    type="search"
                    class="form-control form-control-sm"
                    placeholder="Search..."
                    aria-controls="dataTable"
                  />
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-sm-12">
                <table
                  class="table table-bordered"
                  id="dataTable"
                  width="100%"
                  cellspacing="0"
                >
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Room Number</th>
                      <th>Occupied</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each $roomStore as room}
                      <tr>
                        <td>{room._id}</td>
                        <td>{room.number}</td>
                        <td>{room.isBooked}</td>
                        <td>
                          <a
                            class="small"
                            href="/edit-rooms/{room._id}"
                            use:link
                          >
                            Edit
                          </a>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="row">
              <div class="col-sm-12 col-md-5">
                <div
                  class="dataTables_info"
                  id="dataTable_info"
                  role="status"
                  aria-live="polite"
                >
                  Showing page 1 to 50 of {$roomStore.length} entries
                </div>
              </div>
              <div class="col-sm-12 col-md-7">
                <div
                  class="dataTables_paginate paging_simple_numbers"
                  id="dataTable_paginate"
                >
                  <ul class="pagination">
                    <li
                      class="paginate_button page-item previous disabled"
                      id="dataTable_previous"
                    >
                      <a
                        href="/#/"
                        aria-controls="dataTable"
                        data-dt-idx="0"
                        tabindex="0"
                        class="page-link">Previous</a
                      >
                    </li>
                    <li class="paginate_button page-item active">
                      <a
                        href="/#/"
                        aria-controls="dataTable"
                        data-dt-idx="1"
                        tabindex="0"
                        class="page-link">1</a
                      >
                    </li>
                    <li class="paginate_button page-item">
                      <a
                        href="/#/"
                        aria-controls="dataTable"
                        data-dt-idx="2"
                        tabindex="0"
                        class="page-link">2</a
                      >
                    </li>
                    <li
                      class="paginate_button page-item next"
                      id="dataTable_next"
                    >
                      <a
                        href="/#/"
                        aria-controls="dataTable"
                        data-dt-idx="3"
                        tabindex="0"
                        class="page-link">Next</a
                      >
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</BaseLayout>
