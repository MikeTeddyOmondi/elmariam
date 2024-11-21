<script lang="js">
  // @ts-nocheck

  import axios from "axios";
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import Card from "../components/Card.svelte";
  import Toast from "../components/Toast.svelte";
  import Search from "../components/Search.svelte";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import { drinkStore, getBarDrinks } from "../stores/barStore";

  import Skeleton from "svelte-skeleton-loader";

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  let searchTerm;

  const promise = getBarDrinks();

  // onMount(async () => {
  //   await getBarDrinks();
  // });

  $: submit = async () => {
    // console.log({
    //   customerId,
    //   roomType,
    //   numberAdults,
    //   numberKids,
    //   checkInDate,
    //   checkOutDate,
    // });
    // if (
    //   customerId === "" ||
    //   roomType === "" ||
    //   numberAdults === "" ||
    //   numberKids === "" ||
    //   checkInDate === "" ||
    //   checkOutDate === ""
    // ) {
    //   toastProps = {
    //     isErr: true,
    //     isSucc: false,
    //     toastMsg: "Please enter all the fields!",
    //   };
    //   setTimeout(() => {
    //     toastProps = {
    //       isErr: false,
    //       isSucc: false,
    //       toastMsg: "",
    //     };
    //   }, 5000);
    //   return;
    // }
    // const response = await axiosInstance.post("/hotel/bookings", {
    //   customerId,
    //   roomType,
    //   numberAdults,
    //   numberKids,
    //   checkInDate,
    //   checkOutDate,
    // });
    // // @ts-ignore
    // if (response.name) {
    //   let resData = await response.response?.data.data;
    //   toastProps = {
    //     isErr: true,
    //     isSucc: false,
    //     toastMsg: resData.message,
    //   };
    //   setTimeout(() => {
    //     toastProps = {
    //       isErr: false,
    //       isSucc: false,
    //       toastMsg: "",
    //     };
    //   }, 5000);
    //   return;
    // }
    // console.log({ response });
    // if (response.status === 201) {
    //   console.log({ booking: await response.data.data });
    //   let responseDetails = await response.data;
    //   // let details = await response.data.data;
    //   toastProps = {
    //     isErr: false,
    //     isSucc: true,
    //     toastMsg: `${responseDetails.message}!`,
    //   };
    //   numberAdults = "";
    //   numberKids = "";
    //   checkInDate = "";
    //   checkOutDate = "";
    //   roomType = "";
    //   customerId = "";
    //   setTimeout(() => {
    //     toastProps = {
    //       isErr: false,
    //       isSucc: false,
    //       toastMsg: "",
    //     };
    //   }, 5000);
    //   return;
    // }
  };
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Bar</h1>
      <a
        href="/"
        class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-file-earmark-arrow-down-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1m-1 4v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 11.293V7.5a.5.5 0 0 1 1 0"
          />
        </svg>
        Download Sales Report
        <!-- Cart Icon -->
      </a>
    </div>

    <!-- Content Row -->
    <div class="row">
      <!-- All Bar Form Table -->
      <div class="col-lg-9 mb-4">
        <Toast {toastProps} />

        <Search {searchTerm} />

        {#await promise}
          <div class="card-columns">
            <Skeleton
              class="col-lg-9 mb-4"
              width="100vW"
              height="100vH"
              count={10}
            />
            <Skeleton
              class="col-lg-9 mb-4"
              width="100vW"
              height="100vH"
              count={10}
            />
            <Skeleton
              class="col-lg-9 mb-4"
              width="100vW"
              height="100vH"
              count={10}
            />
          </div>
        {:then drinks}
          <div class="card-columns">
            {#each $drinkStore as barDrink}
              <Card {barDrink} />
            {/each}
          </div>
        {:catch error}
          <div class="row">
            <div class="col-lg-12 mb-1">
              <div
                class="alert alert-danger alert-dismissable text-gray shadow animated--grow-in"
              >
                <!-- <button class="close" data-dismiss="alert">&times;</button> -->
                <b> An error occurred while fetching drinks... </b>
              </div>
            </div>
          </div>
        {/await}
      </div>

      <!-- Drink Stats -->
      <div class="col-lg-3">
        <div class="card shadow mb-2">
          <!-- Card Header - Accordion -->
          <a
            href="#beerStatsCard"
            class="d-block card-header py-3"
            data-toggle="collapse"
            role="button"
            aria-expanded="true"
            aria-controls="beerStatsCard"
          >
            <h6 class="m-0 font-weight-bold text-primary">Beer</h6>
          </a>
          <!-- Card Content - Collapse -->
          <div class="collapse show" id="beerStatsCard" style="">
            <div class="card-body">
              <p>
                <strong>Beer Stats Here!</strong>
              </p>
              <div class="mt-4 text-center small">
                <span class="mr-2">
                  <i class="fas fa-circle text-success" /> Bottles: 5
                </span>
                <span class="mr-2">
                  <i class="fas fa-circle text-danger" /> Cans: 1
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow mb-2">
          <!-- Card Header - Accordion -->
          <a
            href="#wineSpiritsStatsCard"
            class="d-block card-header py-3"
            data-toggle="collapse"
            role="button"
            aria-expanded="true"
            aria-controls="wineSpiritsStatsCard"
          >
            <h6 class="m-0 font-weight-bold text-primary">Wine & Spirits</h6>
          </a>
          <!-- Card Content - Collapse -->
          <div class="collapse show" id="wineSpiritsStatsCard" style="">
            <div class="card-body">
              <p>
                <strong>Beer Stats Here!</strong>
              </p>
              <div class="mt-4 text-center small">
                <span class="mr-2">
                  <i class="fas fa-circle text-success" /> 250ml: 5
                </span>
                <span class="mr-2">
                  <i class="fas fa-circle text-warning" /> 350ml/500ml: 2
                </span>
                <span class="mr-2">
                  <i class="fas fa-circle text-danger" /> 750ml: 1
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow mb-2">
          <!-- Card Header - Accordion -->
          <a
            href="#nonAlcoholicStatsCard"
            class="d-block card-header py-3"
            data-toggle="collapse"
            role="button"
            aria-expanded="true"
            aria-controls="nonAlcoholicStatsCard"
          >
            <h6 class="m-0 font-weight-bold text-primary">Non-alcoholics</h6>
          </a>
          <!-- Card Content - Collapse -->
          <div class="collapse show" id="nonAlcoholicStatsCard" style="">
            <div class="card-body">
              <p>
                <strong>Beer Stats Here!</strong>
              </p>
              <div class="mt-4 text-center small">
                <span class="mr-2">
                  <i class="fas fa-circle text-warning" /> Reay-To-Drink(1L): 3
                </span>
                <span class="mr-2">
                  <i class="fas fa-circle text-danger" /> Water(1L): 1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Bar Sales Table -->
      <div class="col-xl-12 col-md-12 mb-4">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">All Drinks</h6>
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
