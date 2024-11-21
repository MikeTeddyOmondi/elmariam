<script>
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { sessionErrorStore, useLocalStorage } from "../stores/sessionStore";
  import Toast from "../components/Toast.svelte";
  import { axiosInstance } from "../interceptors/axios";

  let url = ``;

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  let session = useLocalStorage("x-user-session");

  sessionErrorStore.subscribe((value) => {
    // toastProps.toastMsg = value

    if (value !== "") {
      toastProps = {
        isErr: true,
        isSucc: false,
        toastMsg: value,
      };
    }
    // Delay for 5sec to autoremove the toast
    setTimeout(async () => {
      toastProps = {
        isErr: false,
        isSucc: false,
        toastMsg: "",
      };
    }, 3000);
  });

  onMount(async () => {
    // url = window.location.hash;
    // console.log(sessionErrorStore.subscribe(value => toastProps.toastMsg = value))
    // try {
    //   console.log(
    //     $session !== null &&
    //       localStorage.getItem("authToken") !== "" &&
    //       JSON.parse($session).alias === ""
    //   );
    //   if (
    //     $session !== null &&
    //     localStorage.getItem("authToken") !== "" &&
    //     JSON.parse($session).alias === ""
    //   ) {
    //     const userInfoResponse = await axiosInstance.get("/auth/user");
    //     if (userInfoResponse.status == 200) {
    //     }
    //     const user = userInfoResponse.data.data.user;
    //     const { _id: id, username: alias } = user;
    //     toastProps = {
    //       isErr: false,
    //       isSucc: true,
    //       toastMsg: `Session found.`,
    //     };
    //     setTimeout(async () => {
    //       toastProps = {
    //         isErr: false,
    //         isSucc: true,
    //         toastMsg: `Redirecting to dashboard...`,
    //       };
    //       await push("/");
    //     }, 3000);
    //     // // Delay for 5sec to autoremove the toast
    //     // setTimeout(async () => {
    //     //   toastProps = {
    //     //     isErr: false,
    //     //     isSucc: false,
    //     //     toastMsg: ``,
    //     //   };
    //     //   await push("/");
    //     // }, 1000);
    //   } else {
    //     console.log($session);
    //     if (typeof $session !== "object") {
    //       localStorage.removeItem("x-user-session");
    //       await push("/login");
    //     }
    //     console.log("Username: ", $session.alias);
    //     if ($session.username === undefined || $session.username === "") {
    //       localStorage.removeItem("x-user-session");
    //       await push("/login");
    //     }
    //     throw Error;
    //   }
    // } catch (error) {
    //   toastProps = {
    //     isErr: true,
    //     isSucc: false,
    //     toastMsg: `Session expired! `,
    //   };
    //   // Delay for 5sec to autoremove the toast
    //   setTimeout(async () => {
    //     toastProps = {
    //       isErr: false,
    //       isSucc: false,
    //       toastMsg: "",
    //     };
    //     await push("/login");
    //   }, 3000);
    // }
  });
</script>

<svelte:head>
  <title>Login | Hotel Elmiriam</title>
</svelte:head>

<!-- <div class="bg-gradient-primary"> -->
<div class="my-2">
  <div class="row justify-content-center">
    <div class="col-xl-6 col-lg-6 col-md-6 mx-4">
      <Toast {toastProps} />
    </div>
  </div>

  <slot />
</div>
