<script>
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { bookingStore, customerStore } from "../stores/hotelStore";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  onMount(async () => {
    try {
      const [customersFetchResponse, bookingsFetchResponse] = await Promise.all(
        [
          axiosInstance.get("/hotel/customers"),
          axiosInstance.get("/hotel/bookings"),
        ]
      );

      let customers = customersFetchResponse.data.data.customers;
      customerStore.update(() => [...customers]);

      let bookings = bookingsFetchResponse.data.data.bookings;
      console.log({ bookings });
      bookingStore.update(() => [...bookings]);
    } catch (e) {
      console.log(e.message);
    }
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
    if (
      customerId === "" ||
      roomType === "" ||
      numberAdults === "" ||
      numberKids === "" ||
      checkInDate === "" ||
      checkOutDate === "" ||
      paymentMethod == ""
    ) {
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: "Please enter all the fields!",
      };
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
      let resData = await response.response.data.data;
      console.log({ resData });
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: resData.message,
      };
      setTimeout(() => {
        toastProps = {
          isErr: false,
          isSucc: false,
          toastMsg: "",
        };
      }, 5000);
      return;
    }

    console.log({ response });

    if (response.status === 201) {
      try {
        let res = await response.data;
        const bookingsFetchResponse =
          await axiosInstance.get("/hotel/bookings");

        let bookings = bookingsFetchResponse.data.data.bookings;
        console.log({ bookings });
        bookingStore.update(() => [...bookings]);

        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `${res.message}!`,
        };

        numberAdults = "";
        numberKids = "";
        checkInDate = "";
        checkOutDate = "";
        roomType = "";
        customerId = "";
        paymentMethod = "";

        setTimeout(() => {
          toastProps = {
            isErr: false,
            isSucc: false,
            toastMsg: "",
          };
        }, 5000);

        return;
      } catch (e) {
        console.log(e.message);
        toastProps = {
          isErr: true,
          isSucc: false,
          toastMsg: `${e.message}!`,
        };
      }
    }
  };
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Hotel</h1>
      <a
        href="/#/customers"
        class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
      >
        <i class="fas fa-plus-circle fa-sm text-white-50" />
        New Customer
      </a>
    </div>

    <Toast {toastProps} />

    <div class="row">
      <!-- Add Users Form -->
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
                  pattern="\d{2}-\d{2}-\d{4}"
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
                  pattern="\d{2}-\d{2}-\d{4}"
                  bind:value={checkOutDate}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="roomType">Payment Method:</label>
                <select class="w-100 form-control" bind:value={paymentMethod}>
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
                          href="/invoices/bookings/{booking._id}"
                          use:link
                        >
                          View
                        </a></td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
              {#if $bookingStore.length === 0}
                <center>
                  <span>No data</span>
                </center>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</BaseLayout>
