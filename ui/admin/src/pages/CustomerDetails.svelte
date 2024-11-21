<script>
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { usersStore } from "../stores/defaultStore";
  import { axiosInstance } from "../interceptors/axios";
  import BaseLayout from "../layouts/baseLayout.svelte";
  import Toast from "../components/Toast.svelte";

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
      <h1 class="h3 mb-0 text-gray-800">Customer Profile</h1>
      <button class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
        <i class="fas fa-download fa-sm text-white-50" />
        Export
      </button>
    </div>

    <!-- Add Users Form -->
    <Toast {toastProps} />

    <div class="row">

    <div class="rounded bg-white m-5">
        <div class="row">
            <div class="col-md-4 border-right">
                <div class="d-flex flex-column align-items-center text-center p-3 py-5">
                    <img class="rounded-circle mt-5" width="150px" src="https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg">
                    <span class="font-weight-bold">Edogaru</span>
                    <span class="text-black-50">edogaru@mail.com.my</span>
                    <span> </span>
                </div>
            </div>
            <div class="col-md-8 border-right">
                <div class="p-3 py-2">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="text-right">Profile Settings</h4>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <label class="labels">Name</label>
                            <input type="text" class="form-control" placeholder="first name" value="">
                        </div>
                        <div class="col-md-6">
                            <label class="labels">Surname</label>
                            <input type="text" class="form-control" value="" placeholder="surname">
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-12"><label class="labels">Mobile Number</label><input type="text" class="form-control" placeholder="enter phone number" value=""></div>
                        <div class="col-md-12"><label class="labels">Address Line 1</label><input type="text" class="form-control" placeholder="enter address line 1" value=""></div>
                        <div class="col-md-12"><label class="labels">Address Line 2</label><input type="text" class="form-control" placeholder="enter address line 2" value=""></div>
                        <div class="col-md-12"><label class="labels">Postcode</label><input type="text" class="form-control" placeholder="enter address line 2" value=""></div>
                        <div class="col-md-12"><label class="labels">State</label><input type="text" class="form-control" placeholder="enter address line 2" value=""></div>
                        <div class="col-md-12"><label class="labels">Area</label><input type="text" class="form-control" placeholder="enter address line 2" value=""></div>
                        <div class="col-md-12"><label class="labels">Email ID</label><input type="text" class="form-control" placeholder="enter email id" value=""></div>
                        <div class="col-md-12"><label class="labels">Education</label><input type="text" class="form-control" placeholder="education" value=""></div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6"><label class="labels">Country</label><input type="text" class="form-control" placeholder="country" value=""></div>
                        <div class="col-md-6"><label class="labels">State/Region</label><input type="text" class="form-control" value="" placeholder="state"></div>
                    </div>
                    <div class="mt-5 text-center"><button class="btn btn-primary profile-button" type="button">Save Profile</button></div>
                </div>
            </div>
        </div>
    </div>

    </div>
  </div>
</BaseLayout>
