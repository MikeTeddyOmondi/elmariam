<script>
  // @ts-ignore
  import axios from "axios";
  import { onMount } from "svelte";
  // import {push} from "svelte-spa-router";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import { axiosInstance } from "../interceptors/axios";
  import { link } from "svelte-spa-router";
  import { customerStore, getAllCustomers } from "../stores/defaultStore";
  import Toast from "../components/Toast.svelte";

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  onMount(async () => {
    await getAllCustomers();
  });

  let firstname = "",
    lastname = "",
    email = "",
    id_number = "",
    phone_number = "";

  $: submit = async () => {
    console.log({
      firstname,
      lastname,
      email,
      id_number,
      phone_number,
    });

    if (
      firstname === "" ||
      lastname === "" ||
      email === "" ||
      id_number === "" ||
      phone_number === ""
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

    const response = await axiosInstance.post("/hotel/customers", {
      firstname,
      lastname,
      email,
      id_number,
      phone_number,
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

    if (response.status === 201) {
      try {
        console.log({ resData: await response?.data?.data });
        let customer = await response?.data?.data?.customer;

        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `Customer: ${customer} created successfully!`,
        };

        await getAllCustomers();

        firstname = "";
        lastname = "";
        email = "";
        id_number = "";
        phone_number = "";

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
      <h1 class="h3 mb-0 text-gray-800">Customers</h1>
      <button class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
        <i class="fas fa-download fa-sm text-white-50" />
        Export
      </button>
    </div>

    <!-- Add Customers Form -->
    <Toast {toastProps} />

    <div class="row">
      <div class="col-xl-12 col-md-12 mb-4">
        <div class="card shadow">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Add Customers</h6>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={submit} autocomplete="off">
              <div class="form-group">
                <label for="firstname">Firstname:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="firstname"
                  id="firstname"
                  autocomplete="off"
                  bind:value={firstname}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="lastname">Lastname:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="lastname"
                  id="lastname"
                  autocomplete="off"
                  bind:value={lastname}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="email">Email:</label>
                <input
                  type="email"
                  class="w-100 form-control"
                  name="email"
                  id="email"
                  autocomplete="off"
                  bind:value={email}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="id_number">ID Number:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="id_number"
                  id="id_number"
                  autocomplete="off"
                  bind:value={id_number}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="phone_number">Phone Number:</label>
                <input
                  type="tel"
                  class="w-100 form-control"
                  name="phone_number"
                  id="phone_number"
                  autocomplete="off"
                  bind:value={phone_number}
                  on:focus={() => (toastProps.isErr = false)}
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
            <h6 class="m-0 font-weight-bold text-primary">All Customers</h6>
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
                    <th>Firstname</th>
                    <th>Lastname</th>
                    <th>Email</th>
                    <th>ID Number</th>
                    <th>Phone Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each $customerStore as customer}
                    <tr>
                      <td>{customer.firstname}</td>
                      <td>{customer.lastname}</td>
                      <td>{customer.email}</td>
                      <td>{customer.id_number}</td>
                      <td>{customer.phone_number}</td>
                      <td
                        ><a
                          class="small"
                          href="/customers/{customer._id}"
                          use:link
                        >
                          <i
                            class="fas fa-edit fa-md fa-fw mr-2 text-gray-400"
                          />
                          Edit
                        </a></td
                      >
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
