<script>
  import { onMount } from "svelte";
  import html2pdf from "html2pdf.js";
  import { writable } from "svelte/store";
  import { editCustomerDetails, getOneCustomer } from "../stores/defaultStore";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";
  export let params = {};

  // @ts-ignore
  let customerId = String(params.id);
  let customerDetails = writable();

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  let firstname = "",
    lastname = "",
    email = "",
    id_number = "",
    phone_number = "";

  onMount(async () => {
    // const customer = await getOneCustomer(customerId);
    // customerDetails.update(() => customer);
    $customerDetails = await getOneCustomer(customerId);
    // console.log({ $customerDetails });
  });

  // function savePdf() {
  //   let elementToPrint = document.getElementById("customer-info");
  //   let timestamp = new Date().getTime();
  //   var options = {
  //     margin: 0.5,
  //     filename: `customer-info-${customerId}-${timestamp}.pdf`,
  //     enableLinks: true,
  //     image: { type: "jpeg", quality: 0.98 },
  //     html2canvas: { scale: 1 },
  //     jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  //   };
  //   html2pdf().set(options).from(elementToPrint).save();
  // }

  $: saveChanges = async () => {
    let formData = {
      id_number,
      firstname,
      lastname,
      phone_number,
    };

    $customerDetails = await editCustomerDetails(customerId, formData);
  };
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Customer Profile</h1>
      <!-- <button
        class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
        on:click={savePdf}
      >
        <i class="fas fa-download fa-sm text-white-50" />
        Export
      </button> -->
    </div>

    <!-- Edit Customer Details Form -->
    <Toast {toastProps} />

    <div class="row" id="customer-info">
      <div class="rounded bg-white m-5 border">
        <div class="row">
          <div class="col-md-12">
            <div
              class="d-flex flex-column align-items-center text-center p-3 py-5"
            >
              <!-- svelte-ignore a11y-img-redundant-alt -->
              <img
                class="rounded-circle mt-5"
                width="150px"
                src="img/undraw_profile.svg"
                alt="profile image"
              />
              <span class="font-weight-bold my-2"
                >{$customerDetails?.firstname ?? ""}
                {$customerDetails?.lastname ?? ""}</span
              >
              <span class="text-black-50">{$customerDetails?.email ?? ""}</span>
              <span> </span>
            </div>
          </div>
          <div class="col-md-12">
            <div class="p-3 py-2">
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <h4 class="text-right">Customer Information</h4>
              </div>
              <div class="row mt-2">
                <div class="col-md-6">
                  <label for="firstname" class="labels">Firstname</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={$customerDetails?.firstname ?? ""}
                    bind:value={firstname}
                  />
                </div>
                <div class="col-md-6">
                  <label for="lastname" class="labels">Lastname</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={$customerDetails?.lastname ?? ""}
                    bind:value={lastname}
                  />
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 my-2">
                  <label for="email" class="labels">Email</label><input
                    type="text"
                    class="form-control"
                    placeholder={$customerDetails?.email ?? ""}
                    bind:value={email}
                  />
                </div>
                <div class="col-md-12 my-2">
                  <label for="phoneNumber" class="labels">Phone Number</label
                  ><input
                    type="text"
                    class="form-control"
                    placeholder={$customerDetails?.phone_number ?? ""}
                    bind:value={phone_number}
                  />
                </div>
                <div class="col-md-12 my-2">
                  <label for="idNumber" class="labels">Id Number</label><input
                    type="text"
                    class="form-control"
                    placeholder={$customerDetails?.id_number ?? ""}
                    bind:value={id_number}
                  />
                </div>
              </div>
              <div class="mt-5 text-center">
                <button
                  class="btn btn-primary profile-button"
                  type="button"
                  on:click={saveChanges}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</BaseLayout>