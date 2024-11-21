<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { link, push } from "svelte-spa-router";
  import { bookingDetails } from "../stores/hotelStore";
  import { axiosInstance } from "../interceptors/axios";
  import html2pdf from "html2pdf.js";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";
  export let params = {};

  let bookingId = params.id;

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  function printFunction() {
    window.print();
  }

  // console.log(capitalizeFirstLetter("hello"));
  function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  onMount(async () => {
    try {
      const response = await axiosInstance.get(`/hotel/bookings/${bookingId}`);

      // @ts-ignore
      if (!response.name) {
        // console.log({ booking: response.data.data.booking });
        let { booking } = response.data.data;
        bookingDetails.update(() => {
          return booking;
        });
        console.log($bookingDetails);
        return;
      } else {
        // @ts-ignore
        throw new Error(`${response.response.data.data.message}`);
      }
    } catch (error) {
      console.log(`Error fetching booking: ${error.message}`);
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: `Failed to fetch invoice: ${error.message}.`,
      };

      setTimeout(async () => {
        toastProps = {
          isErr: false,
          isSucc: false,
          toastMsg: "",
        };
        await push("/hotel");
      }, 5000);
    }
  });

  function savePdf() {
    let elementToPrint = document.getElementById("invoice");
    let timestamp = new Date().getTime();
    var options = {
      margin: 0.5,
      filename: `invoice-${bookingId}-${timestamp}.pdf`,
      enableLinks: true,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 1 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(options).from(elementToPrint).save();
  }

  async function initiateMpesaPayment() {
    try {
      const response = await axiosInstance.post(
        `hotel/mpesa-payment/${bookingId}`
      );
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
        await push("/hotel");
      }, 5000);
    }
  }

  async function notifyViaEmail() {}

  async function notifyViaSMS() {
    try {
      const response = await axiosInstance.post(`hotel/sms/${bookingId}`);
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
      console.log(`Error sending sms notification: ${error.message}`);
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: `Failed to send sms notification: ${error.message}.`,
      };

      setTimeout(async () => {
        toastProps = {
          isErr: false,
          isSucc: false,
          toastMsg: "",
        };
        await push("/hotel");
      }, 5000);
    }
  }
</script>

<BaseLayout>
  <div
    class="container-fluid d-flex flex-column justify-content-center mt-50 mb-50"
  >
    <Toast {toastProps} />

    {#if !toastProps.isErr}
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header bg-transparent header-elements-inline">
              <h6 class="card-title">Hotel invoice</h6>
              <div class="header-elements">
                <button
                  type="button"
                  class="btn btn-light btn-sm no-print"
                  on:click={savePdf}><i class="fas fa-file mr-2" /> Save</button
                >
                <button
                  type="button"
                  class="btn btn-light btn-sm ml-3 no-print"
                  on:click={printFunction}
                  ><i class="fas fa-print mr-2" /> Print</button
                >
              </div>
            </div>

            <div id="invoice">
              <div class="card-body">
                <div class="row">
                  <div class="col-sm-6">
                    <div class="mb-4 pull-left">
                      <h6>Hotel Elmiriam</h6>
                      <ul class="list list-unstyled mb-0 text-left">
                        <li>43 Awasi</li>
                        <li>Kisumu County</li>
                        <li>+254-721-238658</li>
                      </ul>
                    </div>
                  </div>

                  <div class="col-sm-6">
                    <div class="mb-4">
                      <div class="text-sm-right">
                        <h4 class="invoice-color mb-2 mt-md-2">
                          Invoice #{$bookingDetails._id?.slice(0, 7)}
                        </h4>
                        <ul class="list list-unstyled mb-0">
                          <li>
                            Check In Date: <span class="font-weight-semibold"
                              >{new Date(
                                $bookingDetails.checkInDate
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}</span
                            >
                          </li>
                          <li>
                            Check Out Date: <span class="font-weight-semibold"
                              >{new Date(
                                $bookingDetails.checkOutDate
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}</span
                            >
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="d-md-flex flex-md-wrap">
                  <div class="mb-4 mb-md-2 text-left">
                    <span class="text-muted">Invoice To:</span>
                    <ul class="list list-unstyled mb-0">
                      <li>
                        <h5 class="my-2">
                          {capitalizeFirstLetter(
                            String($bookingDetails.customer?.firstname)
                          )}
                          {capitalizeFirstLetter(
                            String($bookingDetails.customer?.lastname)
                          )}
                        </h5>
                      </li>
                      <!-- <li>
                    <span class="font-weight-semibold"
                      >Samantha Mutual funds Ltd</span
                    >
                  </li>
                  <li>Gurung Street</li> -->
                      <li>Email: {$bookingDetails.customer?.email}</li>
                    </ul>
                  </div>

                  <div class="mb-2 ml-auto">
                    <span class="text-muted">Payment Details:</span>
                    <div class="d-flex flex-wrap wmin-md-400">
                      <ul class="list list-unstyled mb-0 text-left">
                        <li><h5 class="my-2">Total Due:</h5></li>
                        <li>Status:</li>
                        <li>Payment Method:</li>
                        <li>Reference/Receipt No.:</li>
                      </ul>

                      <ul class="list list-unstyled text-right mb-0 ml-auto">
                        <li>
                          <h5 class="font-weight-semibold my-2">
                            Kes. {$bookingDetails.invoiceRef?.totalCost.toLocaleString(
                              "en-US"
                            )}
                          </h5>
                        </li>
                        <li>
                          {#if $bookingDetails.invoiceRef?.status === "pending"}
                            <span
                              class="badge badge-danger font-weight-semibold"
                              >Not Paid</span
                            >
                          {:else if $bookingDetails.invoiceRef?.status === "paid"}
                            <span
                              class="badge badge-success font-weight-semibold"
                              >Paid</span
                            >
                          {/if}
                        </li>
                        <li>{$bookingDetails.invoiceRef?.paymentMethod}</li>
                        <li>
                          <span class="font-weight-semibold"
                            >{$bookingDetails._id?.slice(0, 7)}</span
                          >
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-lg">
                  <thead>
                    <tr>
                      <th>Particulars</th>
                      <th>Rate</th>
                      <th>Days</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <h6 class="mb-0">
                          <b
                            >{capitalizeFirstLetter(
                              String($bookingDetails.roomType?.roomType)
                            )}</b
                          > Room
                        </h6>
                        <span class="text-muted"
                          >Booked for <b
                            >{$bookingDetails.numberAdults +
                              $bookingDetails.numberKids}</b
                          >
                          guests from
                          <b
                            >{new Date(
                              $bookingDetails.checkInDate
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}</b
                          >
                          to
                          <b>
                            {new Date(
                              $bookingDetails.checkOutDate
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}</b
                          ></span
                        >
                      </td>
                      <td
                        >Kes. {$bookingDetails.roomType?.rate.toLocaleString(
                          "en-UK"
                        )}</td
                      >
                      <td
                        >{(
                          $bookingDetails.invoiceRef?.subTotalCost /
                          $bookingDetails.roomType?.rate
                        ).toLocaleString("en-US")}</td
                      >
                      <td
                        ><span class="font-weight-semibold"
                          >Kes. {$bookingDetails.invoiceRef?.subTotalCost.toLocaleString(
                            "en-US"
                          )}</span
                        ></td
                      >
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="card-body">
                <div class="d-md-flex flex-md-wrap">
                  <div class="pt-2 mb-3 wmin-md-400 ml-auto">
                    <h6 class="mb-3 text-left">Total due</h6>
                    <div class="table-responsive">
                      <style type="text/css" media="print">
                        .no-print {
                          display: none;
                        }
                      </style>
                      <table class="table">
                        <tbody>
                          <tr>
                            <th class="text-left">Subtotal:</th>
                            <td class="text-right"
                              >Kes. {$bookingDetails.invoiceRef?.subTotalCost.toLocaleString(
                                "en-US"
                              )}</td
                            >
                          </tr>
                          <tr>
                            <th class="text-left"
                              >Tax: <span class="font-weight-normal">(16%)</span
                              ></th
                            >
                            <td class="text-right"
                              >Kes. {$bookingDetails.invoiceRef?.vat.toLocaleString(
                                "en-US"
                              )}</td
                            >
                          </tr>
                          <tr>
                            <th class="text-left">Total:</th>
                            <td class="text-right text-primary"
                              ><h5 class="font-weight-semibold">
                                Kes. {$bookingDetails.invoiceRef?.totalCost.toLocaleString(
                                  "en-US"
                                )}
                              </h5></td
                            >
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <span class="text-muted"
                  >* Charges are subject to Value Added Tax tax.</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row no-print">
        <div class="col-md-12">
          <div class="d-flex flex-row additional-buttons">
            <div>
              <button
                type="button"
                class="btn btn-warning m-2"
                on:click={initiateMpesaPayment}
              >
                <b><i class="fas fa-cogs mr-1" /></b>
                Initiate M-pesa Payment
              </button>
            </div>
            <div>
              <button
                type="button"
                class="btn btn-success m-2"
                on:click={notifyViaEmail}
              >
                <b><i class="fas fa-envelope mr-1" /></b>
                Email invoice
              </button>
            </div>
            <div>
              <button
                type="button"
                class="btn btn-info m-2"
                on:click={notifyViaSMS}
              >
                <b><i class="fas fa-paper-plane mr-1" /></b>
                Send sms
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</BaseLayout>

<style>
  .mt-50 {
    margin-top: 50px;
  }

  .mb-50 {
    margin-bottom: 50px;
  }

  .card {
    position: relative;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-direction: column;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.1875rem;
  }

  /* .card-img-actions {
    position: relative;
  } */

  .card-body {
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    padding: 1.25rem;
  }

  .card-title {
    margin-top: 10px;
    font-size: 17px;
  }

  .invoice-color {
    color: red !important;
  }
  .card-header {
    padding: 0.9375rem 1.25rem;
    margin-bottom: 0;
    background-color: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  }

  /* a {
    text-decoration: none !important;
  } */

  .btn-light {
    color: #333;
    background-color: #fafafa;
    border-color: #ddd;
  }
  .header-elements-inline {
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center;
    -ms-flex-pack: justify;
    justify-content: space-between;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
  }

  .additional-buttons {
    display: flex;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .wmin-md-400 {
      min-width: 400px !important;
    }
  }
</style>
