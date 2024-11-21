<script>
  import axios from "axios";
  import { onMount } from "svelte";
  // import {push} from "svelte-spa-router";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";

  // const HOTEL_API_URI = "http://localhost:8003/ap1/v1";

  let bookings = [];
  let customers = [];
  let isErr = false;
  let errMsg = "";

  onMount(async () => {
    const customersFetchResponse = await axiosInstance.get("/hotel/customers");
    customers = customersFetchResponse.data.data.customers;

    const bookingsFetchResponse = await axiosInstance.get("/hotel/bookings");
    bookings = bookingsFetchResponse.data.data.bookings;
  });

  let roomType = "";
  let customerId = "";
  let numberAdults = "",
    numberKids = "",
    checkInDate = "",
    checkOutDate = "";

  $: bookings;

  $: submit = async () => {
    console.log({
      customerId,
      roomType,
      numberAdults,
      numberKids,
      checkInDate,
      checkOutDate,
    });

    const response = await axios.post("/hotel/bookings", {
      customerId,
      roomType,
      numberAdults,
      numberKids,
      checkInDate,
      checkOutDate,
    });

    // if (response.response.status === 500 || response.response.status === 404) {
    //   let resData = await response.response.data.data;
    //   console.log({ resData });
    //   isErr = true;
    //   errMsg = resData.messsage;
    // }

    let resData;

    console.log({ response });

    if (!response.response.status) {
      if (response.status === 201) {
        console.log({ resData: await response.data.data });

        bookings.push({
          customerId,
          roomType,
          numberAdults,
          numberKids,
          checkInDate,
          checkOutDate,
        });

        numberAdults = "";
        numberKids = "";
        checkInDate = "";
        checkOutDate = "";
      }
    }

    let status = response.response.status;

    switch (status) {
      case 500:
        resData = await response.response.data.data;
        console.log({ response, resData });
        isErr = true;
        errMsg = resData.message;
        break;

      case 404:
        resData = await response.response.data.data;
        console.log({ response, resData });
        isErr = true;
        errMsg = resData.message;
        console.log({ errMsg });

      default:
        break;
    }
  };
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Bookings</h1>
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
            <h6 class="m-0 font-weight-bold text-primary">Add Bookings</h6>
            <center>
              {#if isErr}
                <p class="text-danger"><b>{errMsg}</b></p>
              {/if}
            </center>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={submit} autocomplete="off">
              <div class="form-group">
                <label for="customerId">Customer ID Number:</label>
                <select
                  class="w-100 form-control"
                  bind:value={customerId}
                  on:focus={() => (isErr = false)}
                >
                  {#each customers as customer}
                    <option value={customer.id_number}
                      >{customer.id_number}</option
                    >
                  {/each}
                </select>
              </div>
              <div class="form-group">
                <label for="numberAdults">Number of Adults:</label>
                <input
                  type="number"
                  class="w-100 form-control"
                  name="numberAdults"
                  id="numberAdults"
                  autocomplete="off"
                  bind:value={numberAdults}
                  on:focus={() => (isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="numberKids">Number of Kids:</label>
                <input
                  type="number"
                  class="w-100 form-control"
                  name="numberKids"
                  id="numberKids"
                  autocomplete="off"
                  bind:value={numberKids}
                  on:focus={() => (isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="roomType">Room Type:</label>
                <select class="w-100 form-control" bind:value={roomType}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                </select>
              </div>
              <div class="form-group">
                <label for="checkInDate">Check In Date:</label>
                <input
                  type="date"
                  class="w-100 form-control"
                  name="checkInDate"
                  id="checkInDate"
                  autocomplete="off"
                  placeholder="MM/DD/YYYY"
                  bind:value={checkInDate}
                  on:focus={() => (isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="checkOutDate">Check Out Date:</label>
                <input
                  type="date"
                  class="w-100 form-control"
                  name="checkOutDate"
                  id="checkOutDate"
                  autocomplete="off"
                  placeholder="MM/DD/YYYY"
                  bind:value={checkOutDate}
                  on:focus={() => (isErr = false)}
                />
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
            <h6 class="m-0 font-weight-bold text-primary">All Bookings</h6>
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
                    <th>Customer</th>
                    <th>Room Type</th>
                    <th>Check In Date</th>
                    <th>Check Out Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each bookings as booking}
                    <tr>
                      <td>{booking._id}</td>
                      <td
                        >{booking.customer.firstname}
                        {booking.customer.lastname}</td
                      >
                      <td>{booking.roomType.roomType}</td>
                      <td>{booking.checkInDate}</td>
                      <td>{booking.checkOutDate}</td>
                      <td>Edit</td>
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
