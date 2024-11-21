<script>
  import axios from "axios";
  import { onMount } from "svelte";
  // import {push} from "svelte-spa-router";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import {
    bookingStore,
    customerStore,
    getAllBookings,
    getAllCustomers,
  } from "../stores/defaultStore";
  import Toast from "../components/Toast.svelte";
  import { link } from "svelte-spa-router";

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  onMount(async () => {
    await getAllCustomers();
    await getAllBookings();
  });

  let roomType = "";
  let customerId = "";
  let numberAdults = "",
    numberKids = "",
    checkInDate = "",
    checkOutDate = "",
    paymentMethod = "";

  $: submit = async () => {
    console.log({
      customerId,
      roomType,
      numberAdults,
      numberKids,
      checkInDate,
      checkOutDate,
      paymentMethod,
    });

    toastProps = {
      isErr: false,
      isSucc: false,
      toastMsg: "",
    };

    if (
      customerId === "" ||
      roomType === "" ||
      numberAdults === "" ||
      numberKids === "" ||
      checkInDate === "" ||
      checkOutDate === ""
    ) {
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: "Please enter all the fields!",
      };

      // Delay for 5sec to autoremove the toast
      setTimeout(() => {
        toastProps = {
          isErr: false,
          isSucc: false,
          toastMsg: "",
        };
      }, 5000);
      return;
    }

    const response = await axiosInstance.post("/hotel/bookings", {
      customerId,
      roomType,
      numberAdults,
      numberKids,
      checkInDate,
      checkOutDate,
      paymentMethod,
    });

    // @ts-ignore
    if (response.name) {
      // @ts-ignore
      let responseData = await response?.response?.data?.data;
      console.log({ responseData });

      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: responseData.message,
      };
      return;
    }
    let resData;

    console.log({ response });

    if (response.status === 201) {
      try {
        console.log({ resData: await response?.data?.data });
        let booking = await response?.data?.data?.customer;

        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `Booking: ${booking} created successfully!`,
        };

        await getAllBookings();

        customerId = "";
        roomType = "";
        numberAdults = "";
        numberKids = "";
        checkInDate = "";
        checkOutDate = "";
        paymentMethod = "";

        // Delay for 5sec to autoremove the toast
        setTimeout(() => {
          toastProps = {
            isErr: false,
            isSucc: false,
            toastMsg: "",
          };
        }, 5000);

        return;
      } catch (error) {
        console.log(error);
        console.log(error.message);
        toastProps = {
          isErr: true,
          isSucc: false,
          toastMsg: `${error.message}!`,
        };
      }
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

    <!-- Add Bookings Form -->
    <Toast {toastProps} />

    <div class="row">
      <div class="col-xl-12 col-md-12 mb-4">
        <div class="card shadow">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Add Bookings</h6>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={submit} autocomplete="off">
              <div class="form-group">
                <label for="customerId">Customer ID Number:</label>
                <select
                  class="w-100 form-control"
                  bind:value={customerId}
                  on:focus={() => (toastProps.isErr = false)}
                >
                  {#each $customerStore as customer}
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
                  min="1"
                  class="w-100 form-control"
                  name="numberAdults"
                  id="numberAdults"
                  autocomplete="off"
                  bind:value={numberAdults}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="numberKids">Number of Kids:</label>
                <input
                  type="number"
                  min="0"
                  class="w-100 form-control"
                  name="numberKids"
                  id="numberKids"
                  autocomplete="off"
                  bind:value={numberKids}
                  on:focus={() => (toastProps.isErr = false)}
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
                  on:focus={() => (toastProps.isErr = false)}
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
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="usertype">Payment Method:</label>
                <select
                  class="w-100 form-control"
                  bind:value={paymentMethod}
                  on:focus={() => (toastProps.isErr = false)}
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">Mpesa</option>
                  <option value="card">Card</option>
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
                  {#each $bookingStore as booking}
                    <tr>
                      <td>{booking._id}</td>
                      <td
                        >{booking.customer.firstname}
                        {booking.customer.lastname}</td
                      >
                      <td>{booking.roomType.roomType}</td>
                      <td>{booking.checkInDate}</td>
                      <td>{booking.checkOutDate}</td>
                      <td>
                        <a
                          class="small"
                          href="/bookings/{booking._id}"
                          use:link
                        >
                          <i
                            class="fas fa-edit fa-md fa-fw mr-2 text-gray-400"
                          />
                          Edit
                        </a>
                      </td>
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
