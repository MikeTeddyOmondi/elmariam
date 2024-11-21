<script>
  import { onMount } from "svelte";
  import { link, push } from "svelte-spa-router";
  import { axiosInstance } from "../interceptors/axios";
  import { session, useLocalStorage } from "../stores/sessionStore";
  import Toast from "../components/Toast.svelte";

  let url = ``;
  let username = "";
  let istoggledAdmin = false;
  let istoggledStock = false;
  let istoggledReports = false;
  let istoggledSettings = false;

  let toastProps = {
    isErr: false,
    isSucc: false,
    toastMsg: "",
  };

  const userInfo = {
    id: "",
    alias: "",
  };

  session;
  // let session = useLocalStorage("x-user-session");

  onMount(async () => {
    url = window.location.hash;
    try {
      if (
        $session === null &&
        typeof JSON.parse($session) !== typeof userInfo &&
        JSON.parse($session).alias === "" &&
        JSON.parse($session).alias !== undefined
      ) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("x-user-session");
        localStorage.removeItem("x-refresh-token");

        await push("/login");
        // throw new Error("Invalid session!");
        return;
      }

      // console.log("Session: ", $session);
      // console.log("alias: ", JSON.parse($session).alias);
      username = JSON.parse($session).alias;

      // if (
      //   JSON.parse($session).alias !== undefined ||
      //   JSON.parse($session).alias !== ""
      // ) {
      //   // toastProps = {
      //   //   isErr: false,
      //   //   isSucc: true,
      //   //   toastMsg: `Hello ${username}!`,
      //   // };
      //   // // Delay for 5sec to autoremove the toast
      //   // setTimeout(() => {
      //   //   toastProps = {
      //   //     isErr: false,
      //   //     isSucc: false,
      //   //     toastMsg: "",
      //   //   };
      //   // }, 5000);
      //   return;
      // }
      // throw new Error("Invalid session!");
      // const response = await axiosInstance.get("/auth/user");

      // if (response.status === 200) {
      //   username = response.data.data.user.username;

      //   session.update(() => JSON.stringify(response.data.data.user));

      //   toastProps = {
      //     isErr: false,
      //     isSucc: true,
      //     toastMsg: `Hello ${username}!`,
      //   };
      //   // Delay for 5sec to autoremove the toast
      //   setTimeout(() => {
      //     toastProps = {
      //       isErr: false,
      //       isSucc: false,
      //       toastMsg: "",
      //     };
      //   }, 5000);
      // } else {
      //   session.update(() => null);
      //   toastProps = {
      //     isErr: true,
      //     isSucc: false,
      //     // @ts-ignore
      //     toastMsg: `${response.response.data.data.message} Redirecting to login page!...`,
      //   };

      //   // Delay for 5sec to autoremove the toast
      //   setTimeout(async () => {
      //     toastProps = {
      //       isErr: false,
      //       isSucc: false,
      //       toastMsg: "",
      //     };
      //     await push("/login");
      //   }, 5000);
      // }
    } catch (error) {
      console.log({ error: error.message });
      await push("/login");
    }
  });

  $: logout = async () => {
    await axiosInstance.post(
      "/auth/logout",
      {},
      {
        // withCredentials: true,
        headers: {
          "x-refresh-token": `${localStorage.getItem("x-refresh-token")}`,
        },
      }
    );

    axiosInstance.defaults.headers.common["Authorization"] = "";
    localStorage.removeItem("authToken");
    localStorage.removeItem("x-refresh-token");

    session.update(() => JSON.stringify(userInfo));

    await push("/login");
  };

  $: toggleAdmin = async () => {
    istoggledAdmin = !istoggledAdmin;
  };

  $: toggleStock = async () => {
    istoggledStock = !istoggledStock;
  };

  $: toggleReports = async () => {
    istoggledReports = !istoggledReports;
  };

  $: toggleSettings = async () => {
    istoggledSettings = !istoggledSettings;
  };
</script>

<svelte:head>
  <title>Admin Panel | Hotel Elmiriam</title>
</svelte:head>

<div id="page-top">
  <!-- Page Wrapper -->
  <div id="wrapper">
    <!-- Sidebar -->
    <ul
      class="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion"
      id="accordionSidebar"
    >
      <!-- Sidebar - Brand -->
      <!-- svelte-ignore a11y-invalid-attribute -->
      <a
        class="sidebar-brand d-flex align-items-center justify-content-center"
        href="/#/"
      >
        <div class="sidebar-brand-icon rotate-n-15">
          <i class="fas fa-laugh-wink" />
        </div>
        <div class="sidebar-brand-text mx-3">Hotel Elmiriam</div>
      </a>

      <!-- Divider -->
      <hr class="sidebar-divider my-0" />

      <!-- Nav Item - Dashboard -->
      <li class="nav-item">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a class="nav-link" href="/#/">
          <i class="fas fa-fw fa-tachometer-alt" />
          <span>Dashboard</span></a
        >
      </li>

      <!-- Divider -->
      <hr class="sidebar-divider" />

      <!-- Heading -->
      <div class="sidebar-heading">Admin | Stock Control</div>

      <!-- Nav Item - Pages Collapse Menu -->
      <li class="nav-item {istoggledAdmin ? `active` : ``}">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a
          class="nav-link {istoggledAdmin ? `` : `collapsed`}"
          href="/#/"
          on:click={toggleAdmin}
          data-toggle="collapse"
          data-target="collapseTwo"
          aria-expanded="true"
          aria-controls="collapseTwo"
        >
          <i class="fas fa-fw fa-cog" />
          <span>Administration</span>
        </a>
        {#if istoggledAdmin}
          <div
            id="collapseTwo"
            class="collapse show"
            aria-labelledby="headingTwo"
            data-parent="/accordionSidebar"
          >
            <div class="bg-white py-2 collapse-inner rounded">
              <h6 class="collapse-header">Administration:</h6>
              <a class="collapse-item" href="/#/users">Users</a>
              <a class="collapse-item" href="/#/customers">Customers</a>
              <h6 class="collapse-header">Hotel:</h6>
              <a class="collapse-item" href="/#/bookings">Bookings</a>
              <a class="collapse-item" href="/#/room-types">Room Types</a>
              <a class="collapse-item" href="/#/rooms">Rooms</a>
              <h6 class="collapse-header">Bar:</h6>
              <a class="collapse-item" href="/#/bar-sales">Bar Sales</a>
              <a class="collapse-item" href="/#/bar-drinks">Bar Drink Info</a>
              <h6 class="collapse-header">Restaurant:</h6>
              <a class="collapse-item" href="/#/res-sales">Restaurant Sales</a>
              <a class="collapse-item" href="/#/res-menu"
                >Restaurant Menu Info</a
              >
              <h6 class="collapse-header">Cleaning:</h6>
              <a class="collapse-item" href="/#/room-cleaning">Rooms</a>
              <a class="collapse-item" href="/#/laundry-cleaning">Laundry</a>
              <h6 class="collapse-header">Facility:</h6>
              <a class="collapse-item" href="/#/facilities-info"
                >Facilities Info</a
              >
              <a class="collapse-item" href="/#/facilities-booking"
                >Facility Bookings</a
              >
            </div>
          </div>
        {/if}
      </li>

      <!-- Nav Item - Utilities Collapse Menu -->
      <li class="nav-item {istoggledStock ? `active` : ``}">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a
          class="nav-link {istoggledStock ? `` : `collapsed`}"
          href="/#/"
          on:click={toggleStock}
          data-toggle="collapse"
          data-target="collapseUtilities"
          aria-expanded="true"
          aria-controls="collapseUtilities"
        >
          <i class="fas fa-fw fa-wrench" />
          <span>Stock Control</span>
        </a>
        {#if istoggledStock}
          <div
            id="collapseUtilities"
            class="collapse show"
            aria-labelledby="headingUtilities"
            data-parent="accordionSidebar"
          >
            <div class="bg-white py-2 collapse-inner rounded">
              <h6 class="collapse-header">Stock Control:</h6>
              <a class="collapse-item" href="/#/bar-purchases">Bar Purchases</a>
              <a class="collapse-item" href="/#/res-purchases"
                >Restaurant Purchases</a
              >
            </div>
          </div>
        {/if}
      </li>

      <!-- Divider -->
      <hr class="sidebar-divider" />

      <!-- Heading -->
      <div class="sidebar-heading">Reports & Settings</div>

      <!-- Nav Item - Pages Collapse Menu -->
      <li class="nav-item {istoggledReports ? `active` : ``}">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a
          class="nav-link {istoggledReports ? `` : `collapsed`}"
          href="#"
          on:click={toggleReports}
          data-toggle="collapse"
          data-target="collapsePages"
          aria-expanded="true"
          aria-controls="collapsePages"
        >
          <i class="fas fa-fw fa-folder" />
          <span>Reports</span>
        </a>
        {#if istoggledReports}
          <div
            id="collapsePages"
            class="collapse {istoggledReports ? `show` : ``}"
            aria-labelledby="headingPages"
            data-parent="/accordionSidebar"
          >
            <div class="bg-white py-2 collapse-inner rounded">
              <h6 class="collapse-header">Reports:</h6>
              <a class="collapse-item active" href="/#/">Hotel</a>
              <a class="collapse-item" href="/#/">Bar</a>
              <a class="collapse-item" href="/#/">Restaurant</a>
              <a class="collapse-item" href="/#/">Rooms</a>
              <a class="collapse-item" href="/#/">Laundry</a>
              <a class="collapse-item" href="/#/">Facilites</a>
            </div>
          </div>
        {/if}
      </li>

      <!-- Nav Item - Pages Collapse Menu -->
      <li class="nav-item {istoggledSettings ? `active` : ``}">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a
          class="nav-link {istoggledSettings ? `` : `collapsed`}"
          href="#"
          on:click={toggleSettings}
          data-toggle="collapse"
          data-target="collapsePages"
          aria-expanded="true"
          aria-controls="collapsePages"
        >
          <i class="fas fa-fw fa-cog" />
          <span>Settings</span>
        </a>
        {#if istoggledSettings}
          <div
            id="collapsePages"
            class="collapse {istoggledSettings ? `show` : ``}"
            aria-labelledby="headingPages"
            data-parent="/accordionSidebar"
          >
            <div class="bg-white py-2 collapse-inner rounded">
              <h6 class="collapse-header">User settings:</h6>
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a class="collapse-item" href="/#/user-profile">Profile</a>
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a class="collapse-item" href="/#/change-password"
                >Change Password</a
              >
              <div class="collapse-divider" />
              <h6 class="collapse-header">System Settings:</h6>
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a class="collapse-item" href="/#/backup-system">Backup system</a>
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a class="collapse-item active" href="/#/restore-system"
                >Restore System</a
              >
            </div>
          </div>
        {/if}
      </li>

      <!-- Divider -->
      <hr class="sidebar-divider d-none d-md-block" />

      <!-- Sidebar Toggler (Sidebar) -->
      <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle" />
      </div>
    </ul>
    <!-- End of Sidebar -->

    <!-- Content Wrapper -->
    <div id="content-wrapper" class="d-flex flex-column">
      <!-- Main Content -->
      <div id="content">
        <!-- Topbar -->
        <nav
          class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow"
        >
          <!-- Sidebar Toggle (Topbar) -->
          <button
            id="sidebarToggleTop"
            class="btn btn-link d-md-none rounded-circle mr-3"
          >
            <i class="fa fa-bars" />
          </button>

          <!-- Topbar Search -->
          <form
            class="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search"
          >
            <div class="input-group">
              <input
                type="text"
                class="form-control bg-light border-0 small"
                placeholder="Search for..."
                aria-label="Search"
                aria-describedby="basic-addon2"
              />
              <div class="input-group-append">
                <button class="btn btn-primary" type="button">
                  <i class="fas fa-search fa-sm" />
                </button>
              </div>
            </div>
          </form>

          <!-- Topbar Navbar -->
          <ul class="navbar-nav ml-auto">
            <!-- Nav Item - Search Dropdown (Visible Only XS) -->
            <li class="nav-item dropdown no-arrow d-sm-none">
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a
                class="nav-link dropdown-toggle"
                href="/#/"
                id="searchDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-search fa-fw" />
              </a>
              <!-- Dropdown - Messages -->
              <div
                class="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in"
                aria-labelledby="searchDropdown"
              >
                <form class="form-inline mr-auto w-100 navbar-search">
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control bg-light border-0 small"
                      placeholder="Search for..."
                      aria-label="Search"
                      aria-describedby="basic-addon2"
                    />
                    <div class="input-group-append">
                      <button class="btn btn-primary" type="button">
                        <i class="fas fa-search fa-sm" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </li>

            <!-- Nav Item - Alerts -->
            <li class="nav-item dropdown no-arrow mx-1">
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a
                class="nav-link dropdown-toggle"
                href="/#/"
                id="alertsDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-bell fa-fw" />
                <!-- Counter - Alerts -->
                <span class="badge badge-danger badge-counter">3+</span>
              </a>
              <!-- Dropdown - Alerts -->
              <div
                class="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="alertsDropdown"
              >
                <h6 class="dropdown-header">Alerts Center</h6>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="mr-3">
                    <div class="icon-circle bg-primary">
                      <i class="fas fa-file-alt text-white" />
                    </div>
                  </div>
                  <div>
                    <div class="small text-gray-500">December 12, 2019</div>
                    <span class="font-weight-bold"
                      >A new monthly report is ready to download!</span
                    >
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="mr-3">
                    <div class="icon-circle bg-success">
                      <i class="fas fa-donate text-white" />
                    </div>
                  </div>
                  <div>
                    <div class="small text-gray-500">December 7, 2019</div>
                    $290.29 has been deposited into your account!
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="mr-3">
                    <div class="icon-circle bg-warning">
                      <i class="fas fa-exclamation-triangle text-white" />
                    </div>
                  </div>
                  <div>
                    <div class="small text-gray-500">December 2, 2019</div>
                    Spending Alert: We've noticed unusually high spending for your
                    account.
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a
                  class="dropdown-item text-center small text-gray-500"
                  href="/#/">Show All Alerts</a
                >
              </div>
            </li>

            <!-- Nav Item - Messages -->
            <li class="nav-item dropdown no-arrow mx-1">
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a
                class="nav-link dropdown-toggle"
                href="/#/"
                id="messagesDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-envelope fa-fw" />
                <!-- Counter - Messages -->
                <span class="badge badge-danger badge-counter">7</span>
              </a>
              <!-- Dropdown - Messages -->
              <div
                class="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="messagesDropdown"
              >
                <h6 class="dropdown-header">Message Center</h6>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="dropdown-list-image mr-3">
                    <img
                      class="rounded-circle"
                      src="img/undraw_profile_1.svg"
                      alt="..."
                    />
                    <div class="status-indicator bg-success" />
                  </div>
                  <div class="font-weight-bold">
                    <div class="text-truncate">
                      Hi there! I am wondering if you can help me with a problem
                      I've been having.
                    </div>
                    <div class="small text-gray-500">Emily Fowler · 58m</div>
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="dropdown-list-image mr-3">
                    <img
                      class="rounded-circle"
                      src="img/undraw_profile_2.svg"
                      alt="..."
                    />
                    <div class="status-indicator" />
                  </div>
                  <div>
                    <div class="text-truncate">
                      I have the photos that you ordered last month, how would
                      you like them sent to you?
                    </div>
                    <div class="small text-gray-500">Jae Chun · 1d</div>
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="dropdown-list-image mr-3">
                    <img
                      class="rounded-circle"
                      src="img/undraw_profile_3.svg"
                      alt="..."
                    />
                    <div class="status-indicator bg-warning" />
                  </div>
                  <div>
                    <div class="text-truncate">
                      Last month's report looks great, I am very happy with the
                      progress so far, keep up the good work!
                    </div>
                    <div class="small text-gray-500">Morgan Alvarez · 2d</div>
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item d-flex align-items-center" href="/#/">
                  <div class="dropdown-list-image mr-3">
                    <img
                      class="rounded-circle"
                      src="https://source.unsplash.com/Mv9hjnEUHR4/60x60"
                      alt="..."
                    />
                    <div class="status-indicator bg-success" />
                  </div>
                  <div>
                    <div class="text-truncate">
                      Am I a good boy? The reason I ask is because someone told
                      me that people say this to all dogs, even if they aren't
                      good...
                    </div>
                    <div class="small text-gray-500">Chicken the Dog · 2w</div>
                  </div>
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a
                  class="dropdown-item text-center small text-gray-500"
                  href="/#/">Read More Messages</a
                >
              </div>
            </li>

            <div class="topbar-divider d-none d-sm-block" />

            <!-- Nav Item - User Information -->
            <li class="nav-item dropdown no-arrow">
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a
                class="nav-link dropdown-toggle"
                href="/#/"
                id="userDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span class="mr-2 d-none d-lg-inline text-gray-600 small"
                  >{username}</span
                >
                <img
                  class="img-profile rounded-circle"
                  src="img/undraw_profile.svg"
                  alt={username}
                />
              </a>
              <!-- Dropdown - User Information -->
              <div
                class="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="userDropdown"
              >
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item" href="/#/profiles/{username}" use:link>
                  <i class="fas fa-user fa-sm fa-fw mr-2 text-gray-400" />
                  Profile
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item" href="/#/">
                  <i class="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400" />
                  Settings
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item" href="/#/">
                  <i class="fas fa-list fa-sm fa-fw mr-2 text-gray-400" />
                  Activity Log
                </a>
                <div class="dropdown-divider" />
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a
                  class="dropdown-item"
                  href="/#/"
                  on:click={logout}
                  data-toggle="modal"
                  data-target="logoutModal"
                >
                  <i
                    class="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"
                  />
                  Logout
                </a>
              </div>
            </li>
          </ul>
        </nav>
        <!-- End of Topbar -->

        <!-- Begin Page Content -->
        <div class="container-fluid">
          <Toast {toastProps} />
        </div>

        <slot />
        <!-- /.container-fluid -->
      </div>
      <!-- End of Main Content -->

      <!-- Footer -->
      <footer class="sticky-footer bg-white">
        <div class="container my-auto">
          <div class="copyright text-center my-auto">
            <span
              >Copyright &copy; Hotel Elmiriam {new Date(
                Date.now()
              ).getFullYear()}</span
            >
          </div>
        </div>
      </footer>
      <!-- End of Footer -->
    </div>
    <!-- End of Content Wrapper -->
  </div>
  <!-- End of Page Wrapper -->

  <!-- Scroll to Top Button-->
  <a class="scroll-to-top rounded" href="#page-top">
    <i class="fas fa-angle-up" />
  </a>

  <!-- Logout Modal-->
  <div
    class="modal fade"
    id="logoutModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Ready to Leave?</h5>
          <button
            class="close"
            type="button"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div class="modal-body">
          Select "Logout" below if you are ready to end your current session.
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" type="button" data-dismiss="modal"
            >Cancel</button
          >
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a
            class="btn btn-primary"
            href="/#/avascript:void(0)"
            on:click={logout}>Logout</a
          >
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @media print {
    .no-print {
      display: none;
    }
  }
</style>
