<script>
  import axios from "axios";
  import { onMount } from "svelte";
  import { link, push } from "svelte-spa-router";
  import { axiosInstance } from "../interceptors/axios";
  import { drinkCartItems } from "../stores/barStore";

  let url = ``;
  let username = "";

  onMount(async () => {
    url = window.location.hash;

    const response = await axiosInstance.get("/auth/user");

    if (response.status === 200) {
      username = response.data.data.user.username;
    } else {
      await push("/login");
    }
  });

  $: logout = async () => {
    await axiosInstance.post("/auth/logout", {});

    axios.defaults.headers.common["Authorization"] = "";
    localStorage.removeItem("authToken");
    localStorage.removeItem("x-refresh-token");

    await push("/login");
  };
</script>

<svelte:head>
  <title>User Panel | Hotel Elmiriam</title>
</svelte:head>

<div id="page-top">
  <!-- Page Wrapper -->
  <div id="wrapper">
    <!-- Content Wrapper -->
    <div id="content-wrapper" class="d-flex flex-column">
      <!-- Main Content -->
      <div id="content">
        <!-- Topbar -->
        <nav
          class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow"
        >
          <a
            href="/"
            use:link
            class="d-flex form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 text-decoration-none"
          >
            <h4>Hotel Elmiriam</h4>
          </a>
          <!-- Topbar Search -->
          <!-- <form
            class="d-none d-sm-inline-block form-inline ml-md-3 my-2 my-md-0 mw-100 navbar-search"
          >
            <div class="input-group">
              <input
                type="text"
                class="form-control bg-light border-0 small"
                placeholder="Search..."
                aria-label="Search"
                aria-describedby="basic-addon2"
              />
              <div class="input-group-append">
                <button class="btn btn-primary" type="button">
                  <i class="fas fa-search fa-sm" />
                </button>
              </div>
            </div>
          </form> -->

          <!-- Topbar Navbar -->
          <ul class="navbar-nav ml-auto">
            <!-- Nav Item - Search Dropdown (Visible Only XS) -->
            <li class="nav-item dropdown no-arrow d-sm-none">
              <!-- svelte-ignore a11y-invalid-attribute -->
              <!-- <a
                class="nav-link dropdown-toggle"
                href="/#/"
                id="searchDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-search fa-fw" />
              </a> -->
              <!-- Dropdown - Messages -->
              <!-- <div
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
              </div> -->
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

            <!-- Cart Icon -->
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-cart"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"
                  />
                </svg>
                <!-- Cart - Items Amount -->
                {#if $drinkCartItems.length !== 0}
                  <span class="badge badge-danger badge-counter"
                    >{$drinkCartItems.length}</span
                  >
                {:else}
                  <span class="badge badge-danger badge-counter"></span>
                {/if}
              </a>
              <!-- Cart - Items List -->
              <div
                class="dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in"
                aria-labelledby="messagesDropdown"
              >
                <h6 class="dropdown-header">Cart</h6>
                {#if $drinkCartItems.length === 0}
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <a
                    class="dropdown-item text-center small text-gray-500"
                    href="/#/bar">Empty Cart...</a
                  >
                {:else}
                  {#each $drinkCartItems as cartItem}
                    <!-- svelte-ignore a11y-invalid-attribute -->
                    <div class="dropdown-item d-flex align-items-center">
                      <div class="dropdown-list-image mr-3">
                        <img
                          class="rounded-circle"
                          src={cartItem.imageUrl}
                          alt={cartItem.drinkCode}
                        />
                        <div
                          class="status-indicator
                        {cartItem.inStock ? 'bg-success' : 'bg-danger'}"
                        />
                      </div>
                      <div class="font-weight-bold">
                        <div
                          class="d-flex flex-row align-items-center justify-content-center"
                        >
                          <div class="text-truncate">{cartItem.drinkName}</div>
                          <div class="text-danger px-2 float-end">
                            <!-- <button
                              class="btn btn-outline-danger"
                              on:click={() => removeFromDrinkCart(cartItem._id)}
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
                            </button> -->
                          </div>
                        </div>
                        <div class="small text-gray-500">{cartItem.amount}</div>
                      </div>
                    </div>
                  {/each}
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <!-- <a class="dropdown-item d-flex align-items-center" href="/#/">
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
                </a> -->
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <!-- <a class="dropdown-item d-flex align-items-center" href="/#/">
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
                </a> -->
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <!-- <a class="dropdown-item d-flex align-items-center" href="/#/">
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
                </a> -->
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <a
                    class="dropdown-item text-center small text-gray-500"
                    href="/#/drink-cart">More Cart Information...</a
                  >
                {/if}
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
                <a class="dropdown-item" href="/profiles/{username}" use:link>
                  <i class="fas fa-user fa-sm fa-fw mr-2 text-gray-400" />
                  Profile
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item" href="/settings">
                  <i class="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400" />
                  Settings
                </a>
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a class="dropdown-item" href="/activity">
                  <i class="fas fa-list fa-sm fa-fw mr-2 text-gray-400" />
                  Activity Log
                </a>
                <div class="dropdown-divider" />
                <!-- svelte-ignore a11y-invalid-attribute -->
                <a
                  class="dropdown-item"
                  href="/#/logout"
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
        <ul class="nav nav-tabs nav-fill mb-4 no-print">
          <li class="nav-item">
            <a class="nav-link {url === '#/' ? 'active' : ''}" href="/" use:link
              >Overview</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link {url === '#/hotel' ? 'active' : ''}"
              href="/hotel"
              use:link>Hotel</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link {url === '#/bar' ? 'active' : ''}"
              href="/bar"
              use:link>Bar</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link {url === '#/restaurant' ? 'active' : ''}"
              href="/restaurant"
              use:link>Restaurant</a
            >
          </li>
        </ul>

        <div class="container">
          <slot />
        </div>
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
            href="/#/javascript:void(0)"
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
