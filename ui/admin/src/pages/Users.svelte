<script>
  import axios from "axios";
  import { afterUpdate, onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { usersStore } from "../stores/defaultStore";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";
  import { waitFor } from "../utils/helpers";

  let numEntries = $usersStore.length;
  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  let userType;
  let isAdmin = false;
  let isActive = false;
  let isVerified = false;
  let username = "",
    email = "",
    id_number = "",
    password = "";

  onMount(async () => {
    const response = await axiosInstance.get("/auth/accounts");
    console.log({ allAccounts: response.data.data });
    let users = response.data.data.users;
    usersStore.update(() => [...users]);
  });

  $: submit = async () => {
    console.log({
      username,
      email,
      id_number,
      password,
      userType,
      isAdmin,
      isActive,
      isVerified,
    });
    if (
      username === "" ||
      email === "" ||
      id_number === "" ||
      password === "" ||
      userType === ""
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

    const response = await axiosInstance.post("/auth/register", {
      username,
      email,
      id_number,
      password,
      userType,
    });
    console.log({ response });

    // @ts-ignore
    if (response.name) {
      // @ts-ignore
      let responseData = await response.response.data;
      console.log(responseData);

      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: responseData.message,
      };
      return;
    }

    if (response.status === 201) {
      try {
        console.log({ resData: await response.data.data });
        let user = await response.data.data.user;

        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `User: ${user} created successfully!`,
        };

        const usersFetchResponse = await axiosInstance.get("/auth/accounts");

        let users = usersFetchResponse.data.data.users;
        console.log({ users });
        usersStore.update(() => [...users]);

        username = "";
        email = "";
        password = "";
        id_number = "";

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
      <h1 class="h3 mb-0 text-gray-800">Users</h1>
      <button class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
        <i class="fas fa-download fa-sm text-white-50" />
        Export
      </button>
    </div>

    <!-- Add Users Form -->
    <Toast {toastProps} />

    <div class="row">
      <div class="col-xl-12 col-md-12 mb-4">
        <div class="card shadow">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Add Users</h6>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={submit} autocomplete="off">
              <div class="form-group">
                <label for="username">Username:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="username"
                  id="username"
                  autocomplete="off"
                  bind:value={username}
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
                <label for="password">Password:</label>
                <input
                  type="password"
                  class="w-100 form-control"
                  name="password"
                  id="password"
                  autocomplete="off"
                  bind:value={password}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="usertype">Usertype:</label>
                <select
                  class="w-100 form-control"
                  bind:value={userType}
                  on:focus={() => (toastProps.isErr = false)}
                >
                  <option value="staff">Staff</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <div class="form-check">
                <input
                  type="checkbox"
                  name="isActive"
                  class="form-check-input"
                  bind:checked={isActive}
                  on:focus={() => (toastProps.isErr = false)}
                />
                <label for="isActive">Active</label>
              </div>
              <div class="form-check">
                <input
                  type="checkbox"
                  name="isVerified"
                  class="form-check-input"
                  bind:checked={isVerified}
                  on:focus={() => (toastProps.isErr = false)}
                />
                <label for="isVerified">Verified</label>
              </div>
              <div class="form-check">
                <input
                  type="checkbox"
                  name="isAdmin"
                  class="form-check-input"
                  bind:checked={isAdmin}
                  on:focus={() => (toastProps.isErr = false)}
                />
                <label for="isAdmin">Admin</label>
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
            <h6 class="m-0 font-weight-bold text-primary">All Users</h6>
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
                    <th>Username</th>
                    <th>Email</th>
                    <th>ID Number</th>
                    <th>IsActive</th>
                    <th>IsVerified</th>
                    <th>IsAdmin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each $usersStore as user}
                    <tr>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.id_number}</td>
                      <td>{user.isActive}</td>
                      <td>{user.isVerified}</td>
                      <td>{user.isAdmin}</td>
                      <td>
                        <a
                          class="small"
                          href="/users/{user._id}"
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
