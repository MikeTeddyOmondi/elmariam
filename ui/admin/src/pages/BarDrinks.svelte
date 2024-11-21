<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { drinkStore, getBarDrinks, usersStore } from "../stores/defaultStore";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";
  // @ts-ignore
  import { waitFor } from "../utils/helpers";

  // @ts-ignore
  let numEntries = $drinkStore.length;
  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  let buyingPrice;
  let sellingPrice;
  let drinkName = "",
    drinkCode = "",
    typeOfDrink = null,
    uom = null,
    file = "";

  onMount(async () => {
    await getBarDrinks();
  });

  // @ts-ignore
  $: submit = async (event) => {
    const form = event.target;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (
      drinkName === "" ||
      drinkCode === "" ||
      typeOfDrink === null ||
      typeOfDrink === "" ||
      uom === null ||
      uom === "" ||
      buyingPrice === "" ||
      sellingPrice === "" ||
      // @ts-ignore
      file?.name === ""
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

    const response = await axiosInstance.post("/bar/drinks", formData, {
      headers: { "Content-Type": "multipart/form-data" },
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
        toastMsg: responseData.data.message,
      };
      return;
    }

    if (response.status === 201) {
      try {
        await getBarDrinks();

        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `${response?.data?.data?.message}`,
        };

        form.reset();
        typeOfDrink = null;
        uom = null;

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
      <h1 class="h3 mb-0 text-gray-800">Bar Drinks Information</h1>
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
            <h6 class="m-0 font-weight-bold text-primary">Add Bar Drinks</h6>
          </div>
          <div class="card-body">
            <form
              on:submit|preventDefault={submit}
              autocomplete="off"
              enctype="multipart/form-data"
            >
              <div class="form-group">
                <label for="drinkName">Drink Name:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="drinkName"
                  id="drinkName"
                  autocomplete="off"
                  bind:value={drinkName}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="drinkCode">Drink Code:</label>
                <input
                  type="text"
                  class="w-100 form-control"
                  name="drinkCode"
                  id="drinkCode"
                  autocomplete="off"
                  bind:value={drinkCode}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="typeOfDrink">Type of Drink:</label>
                <select
                  class="w-100 form-control"
                  name="typeOfDrink"
                  bind:value={typeOfDrink}
                  on:focus={() => (toastProps.isErr = false)}
                >
                  <option value={null}>Select type of drink</option>
                  <option value="spirit">Spirit</option>
                  <option value="beer">Beer</option>
                  <option value="rtd">Ready to Drink</option>
                  <option value="wine">Wine</option>
                  <option value="water">Water</option>
                </select>
              </div>
              <div class="form-group">
                <label for="uom">Unit of Measurement:</label>
                <select
                  class="w-100 form-control"
                  name="uom"
                  bind:value={uom}
                  on:focus={() => (toastProps.isErr = false)}
                >
                  <option value={null}>Select unit of measurement</option>
                  <option value="bottles">Bottles</option>
                  <option value="crates">Crates</option>
                </select>
              </div>
              <div class="form-group">
                <label for="buyingPrice">Buying Price:</label>
                <input
                  type="number"
                  class="w-100 form-control"
                  name="buyingPrice"
                  id="buyingPrice"
                  autocomplete="off"
                  bind:value={buyingPrice}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="sellingPrice">Selling Price:</label>
                <input
                  type="number"
                  class="w-100 form-control"
                  name="sellingPrice"
                  id="sellingPrice"
                  autocomplete="off"
                  bind:value={sellingPrice}
                  on:focus={() => (toastProps.isErr = false)}
                />
              </div>
              <div class="form-group">
                <label for="file">File:</label>
                <input
                  type="file"
                  class="w-100 form-control"
                  name="file"
                  id="file"
                  bind:files={file}
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
                    <th>Drink Name</th>
                    <th>Drink Code</th>
                    <th>Type of Drink</th>
                    <th>Unit of Measurement</th>
                    <th>Buying Price</th>
                    <th>Selling Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each $drinkStore as drink}
                    <tr>
                      <td>{drink.drinkName}</td>
                      <td>{drink.drinkCode}</td>
                      <td>{drink.typeOfDrink}</td>
                      <td>{drink.uom}</td>
                      <td>{drink.buyingPrice}</td>
                      <td>{drink.sellingPrice}</td>
                      <td>
                        <a
                          class="small"
                          href="/bar-drinks/{drink._id}"
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
