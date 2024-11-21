<script>
  import axios from "axios";
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import { axiosInstance } from "../interceptors/axios";

  let roomtypes = [];
  let isErr = false;
  let errMsg = "";

  onMount(async () => {
    // let authToken = localStorage.getItem("authToken");
    const roomtypesFetchResponse = await axiosInstance.get("/hotel/roomtypes");
    roomtypes = [...roomtypesFetchResponse.data.data.roomTypes];
  });

  let title = "";
  let description = "",
    rate,
    capacity,
    roomType = "";

  $: roomtypes;

  $: submit = async () => {
    console.log({
      title,
      description,
      rate,
      capacity,
      roomType,
    });

    const response = await axiosInstance.post("/hotel/rooms/types", {
      title,
      description,
      rate,
      capacity,
      roomType,
    });

    let resData;

    console.log({ response });

    if (response.status === 201) {
      console.log({ resData: await response.data.data });

      roomtypes.push({
        title,
        description,
        rate,
        capacity,
        roomType,
      });

      title = "";
      description = "";
      rate = "";
      capacity = "";
      roomType = "";
    }
  };
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Room Types</h1>
      <button class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
        <i class="fas fa-download fa-sm text-white-50" />
        Export
      </button>
    </div>

    <!-- Add Users Form -->
    <div class="row">
      <div class="col-xl-12 col-md-12 mb-4">
        <div class="card shadow">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Add Room Types</h6>
            <center>
              {#if isErr}
                <p class="text-danger"><b>{errMsg}</b></p>
              {/if}
            </center>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={submit} autocomplete="off">
              <div class="form-group">
                <label for="title">Room Type Title:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="title"
                  id="title"
                  autocomplete="off"
                  bind:value={title}
                />
              </div>
              <div class="form-group">
                <label for="description">Room Type Description:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="description"
                  id="description"
                  autocomplete="off"
                  bind:value={description}
                />
              </div>
              <div class="form-group">
                <label for="rate">Room Type Rate:</label>
                <input
                  type="number"
                  class="w-100 form-control"
                  name="rate"
                  id="rate"
                  autocomplete="off"
                  bind:value={rate}
                />
              </div>
              <div class="form-group">
                <label for="capacity">Room Type Capacity:</label>
                <input
                  type="number"
                  class="w-100 form-control"
                  name="capacity"
                  id="capacity"
                  autocomplete="off"
                  bind:value={capacity}
                />
              </div>
              <div class="form-group">
                <label for="roomType">Room Type:</label>
                <select class="w-100 form-control" bind:value={roomType}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
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

      <!-- All Users Table -->
      <div class="col-xl-12 col-md-12 mb-4">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">All Room Types</h6>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table
                class="table table-bordered"
                id="dataTable"
                width="100%"
                cellspacing="0"
              >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room Type</th>
                    <th>Rate</th>
                    <th>Capacity</th>
                    <th>Reservations Made</th>
                  </tr>
                </thead>
                <tbody>
                  {#each roomtypes as roomtype}
                    <tr>
                      <td>{roomtype._id}</td>
                      <td>{roomtype.roomType}</td>
                      <td>{roomtype.rate}</td>
                      <td>{roomtype.capacity}</td>
                      <td>{roomtype.reservations.bookingRef.length}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</BaseLayout>
