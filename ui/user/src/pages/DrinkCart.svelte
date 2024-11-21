<script>
  import Toast from "../components/Toast.svelte";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import { axiosInstance } from "../interceptors/axios";
  import { drinkCartItems, removeFromDrinkCart } from "../stores/barStore";

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  const initialTotal = 0;

  $: subTotal = $drinkCartItems.reduce((accumulator, currentDrink) => {
    if (currentDrink.uom === "bottles") {
      return accumulator + currentDrink.sellingPrice * currentDrink.amount;
    } else if (currentDrink.uom === "crates") {
      return (
        accumulator + (currentDrink.sellingPrice / 24) * currentDrink.amount
      );
    } else {
      return accumulator; // ignore other uom values
    }
  }, initialTotal);

  // Checkout
  async function createBarSale() {
    console.log("Creating bar sale");
    try {
      const response = await axiosInstance.post(`bar/sales`);
      // @ts-ignore
      if (!response.name) {
        console.log(response);
        console.log({ message: response.data.data.message });
        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `${response.data.data.message}`,
        };
        return;
      } else {
        // @ts-ignore
        throw new Error(`${response.response.data.data.message}`);
      }
    } catch (error) {
      console.log(`Error creating bar sale: ${error.message}`);
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: `Failed to create bar sale: ${error.message}.`,
      };

      setTimeout(async () => {
        toastProps = {
          isErr: false,
          isSucc: false,
          toastMsg: "",
        };
      }, 5000);
    }
  }  

  // LipaNaMpesa
  async function lipaNaMpesa(barSaleId) {
    console.log("mpesa checkout", barSaleId);
    try {
      const response = await axiosInstance.post(`bar/sales/lipa-mpesa/{barSaleId}`);
      // @ts-ignore
      if (!response.name) {
        console.log(response);
        console.log({ message: response.data.data.message });
        toastProps = {
          isErr: false,
          isSucc: true,
          toastMsg: `${response.data.data.message}`,
        };
        return;
      } else {
        // @ts-ignore
        throw new Error(`${response.response.data.data.message}`);
      }
    } catch (error) {
      console.log(`Error initiating payment: ${error.message}`);
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: `Failed to initiate payment: ${error.message}.`,
      };

      setTimeout(async () => {
        toastProps = {
          isErr: false,
          isSucc: false,
          toastMsg: "",
        };
      }, 5000);
    }
  }
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Content Row -->
    <div class="row">
      <!-- Cart -->
      <div class="col-xl-12 col-md-12">
        <div class="col-xl-12 col-md-12 mb-4">
          <Toast {toastProps} />

          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">Cart</h6>
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
                      <th>Code</th>
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each $drinkCartItems as drink}
                      <tr>
                        <td>{drink.drinkCode}</td>
                        <td>{drink.drinkName}</td>
                        <td>{drink.amount}</td>
                        {#if drink.uom === "crates"}
                          <td
                            >{Number(drink.sellingPrice / 24).toLocaleString(
                              "en-US",
                              { minimumFractionDigits: 2 }
                            )}</td
                          >
                        {:else}
                          <td
                            >{drink.sellingPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}</td
                          >
                        {/if}

                        <td>
                          <button
                            class="btn btn-outline-danger"
                            on:click={() => removeFromDrinkCart(drink._id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              class="bi bi-trash3-fill"
                              viewBox="0 0 16 16"
                            >
                              <path
                                d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
                {#if $drinkCartItems.length === 0}
                  <center>
                    <span>Empty cart...</span>
                  </center>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Drink Stats -->
        <div class="col-lg-12 mb-4">
          <div class="card shadow mb-4">
            <!-- Card Header - Accordion -->
            <a
              href="#beerStatsCard"
              class="d-block card-header py-3"
              data-toggle="collapse"
              role="button"
              aria-expanded="true"
              aria-controls="beerStatsCard"
            >
              <h6 class="m-0 font-weight-bold text-primary">Summary</h6>
            </a>
            <!-- Card Content - Collapse -->
            <div class="collapse show" id="beerStatsCard" style="">
              <div class="card-body d-flex flex-row">
                <div class="mb-2 mx-auto">
                  <div class="d-flex flex-wrap wmin-md-400">
                    <ul class="list list-unstyled mb-0 text-left">
                      <li><h5 class="my-2">Subtotal:</h5></li>
                      <li><h5 class="my-2">Tax:</h5></li>
                    </ul>

                    <ul class="list list-unstyled text-right mb-0 ml-auto">
                      <li>
                        <h5 class="font-weight-semibold my-2">
                          Kes. {subTotal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </h5>
                      </li>
                      <li>
                        Kes. {(0.16 * Number(subTotal)).toLocaleString(
                          "en-US",
                          { minimumFractionDigits: 2 }
                        )}
                      </li>
                    </ul>
                  </div>

                  <button
                    class="btn btn-primary my-4 w-100 d-flex align-content-center justify-content-center"
                    on:click={() => createBarSale()}
                  >
                    Create Bar Sale
                  </button>
                  <!-- <button
                    class="btn btn-outline-success my-4 w-100 d-flex align-content-center justify-content-center"
                    on:click={() => lipaNaMpesa()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="28"
                      height="28"
                      viewBox="0,0,300,150"
                    >
                      <g
                        fill="none"
                        stroke="none"
                        stroke-width="1"
                        stroke-linecap="butt"
                        stroke-linejoin="miter"
                        stroke-miterlimit="10"
                        stroke-dasharray=""
                        stroke-dashoffset="0"
                        font-family="none"
                        font-weight="none"
                        font-size="none"
                        text-anchor="none"
                        style="mix-blend-mode: normal"
                        ><g transform="scale(5.33333,5.33333)"
                          ><path
                            d="M31.003,7.001l-0.001,-5.5c0,-0.828 0.672,-1.5 1.5,-1.5c0.828,0 1.5,0.672 1.5,1.5v5.5z"
                            fill="#000000"
                            fill-rule="nonzero"
                          ></path><path
                            d="M14.964,47.999h18.073c0.533,0 0.965,-0.432 0.965,-0.965v-42.07c0,-0.533 -0.432,-0.965 -0.965,-0.965h-18.073c-0.533,0 -0.965,0.432 -0.965,0.965v42.07c0,0.533 0.432,0.965 0.965,0.965z"
                            fill="#000000"
                            fill-rule="nonzero"
                          ></path><path
                            d="M17.739,29.001h12.524c0.962,0 1.741,-0.78 1.741,-1.741v-16.517c0,-0.962 -0.78,-1.741 -1.741,-1.741h-12.524c-0.962,0 -1.741,0.78 -1.741,1.741v16.517c-0.001,0.962 0.779,1.741 1.741,1.741z"
                            fill="#ffffff"
                            fill-rule="evenodd"
                          ></path><path
                            d="M12.001,22.001c3.643,-0.7 5.865,-2.448 7,-5c1.135,2.552 3.357,4.3 7,5z"
                            fill="#9b2310"
                            fill-rule="evenodd"
                          ></path><path
                            d="M12.001,22.001c4.273,0.867 6.476,1 11,1c5.076,0 11.712,-1.939 14,-6l-9,-4c-3.962,5.138 -6.138,9 -16,9z"
                            fill="#e60023"
                            fill-rule="evenodd"
                          ></path></g
                        ></g
                      >
                    </svg>
                    Lipa na Mpesa
                  </button> -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</BaseLayout>
