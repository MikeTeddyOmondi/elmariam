<script>
  // import axios from "axios";
  // import {push} from "svelte-spa-router";
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import BaseLayout from "../layouts/baseLayout.svelte";

  let barCanvas;
  let pieCanvas;
  const xBarValues = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const xPieValues = [
    "Hotel",
    "Bar",
    "Restaurant",
  ];
  const yPieValues = [75, 48, 24];
  const yBarValues = [55, 49, 44, 24, 15, 55, 49, 44, 24, 15, 55, 72];
  const barColors = ["#4e73df"];
  const pieColors = ["#4e73df", "#1cc88a", "#36b9cc"];

  onMount(() => {
    const barCtx = barCanvas.getContext("2d");
    const pieCtx = pieCanvas.getContext("2d");

    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: xBarValues,
        datasets: [
          {
            backgroundColor: barColors,
            data: yBarValues,
            label: "Revenue (Monthly)",
          },
        ],
      },
      options: {
        plugins: {},
      },
    });

    new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: xPieValues,
        datasets: [
          {
            backgroundColor: pieColors,
            data: yPieValues,
          },
        ],
      },
      options: {},
    });
  });
</script>

<BaseLayout>
  <div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0 text-gray-800">Overview</h1>
      <a
        href="/"
        class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
        ><i class="fas fa-download fa-sm text-white-50" /> Generate Report</a
      >
    </div>

    <!-- Content Row -->
    <div class="row">
      <!-- Revenue Card -->
      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-primary text-uppercase mb-1"
                >
                  Total revenue (Daily)
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  Kshs. 10,000
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-calendar fa-2x text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Card -->
      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-success text-uppercase mb-1"
                >
                  Total revenue (monthly)
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  Kshs. 30,000
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-dollar-sign fa-2x text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Earnings (Monthly) Card Example -->
      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-info text-uppercase mb-1"
                >
                  Check Ins
                </div>
                <div class="row no-gutters align-items-center">
                  <div class="col-auto">
                    <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">
                      5
                    </div>
                  </div>
                  <div class="col">
                    <div class="progress progress-sm mr-2">
                      <div
                        class="progress-bar bg-info"
                        role="progressbar"
                        style="width: 10%"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-clipboard-list fa-2x text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Requests Card Example -->
      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-warning shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-warning text-uppercase mb-1"
                >
                  Bar Requests
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">12</div>
              </div>
              <div class="col-auto">
                <i class="fas fa-comments fa-2x text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Row -->
    <div class="row">
      <!-- Area Chart -->
      <div class="col-xl-8 col-lg-7">
        <div class="card shadow mb-4">
          <!-- Card Header - Dropdown -->
          <div
            class="card-header py-3 d-flex flex-row align-items-center justify-content-between"
          >
            <h6 class="m-0 font-weight-bold text-primary">Revenue Overview</h6>
            <div class="dropdown no-arrow">
              <a
                class="dropdown-toggle"
                href="/"
                role="button"
                id="dropdownMenuLink"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400" />
              </a>
              <div
                class="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                aria-labelledby="dropdownMenuLink"
              >
                <div class="dropdown-header">Dropdown Header:</div>
                <a class="dropdown-item" href="/">Action</a>
                <a class="dropdown-item" href="/">Another action</a>
                <div class="dropdown-divider" />
                <a class="dropdown-item" href="/">Something else here</a>
              </div>
            </div>
          </div>
          <!-- Card Body -->
          <div class="card-body">
            <div class="chart-area">
              <canvas
                id="barChart"
                width={1000}
                height={500}
                bind:this={barCanvas}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Pie Chart -->
      <div class="col-xl-4 col-lg-5">
        <div class="card shadow mb-4">
          <!-- Card Header - Dropdown -->
          <div
            class="card-header py-3 d-flex flex-row align-items-center justify-content-between"
          >
            <h6 class="m-0 font-weight-bold text-primary">Revenue Sources</h6>
            <div class="dropdown no-arrow">
              <a
                class="dropdown-toggle"
                href="/"
                role="button"
                id="dropdownMenuLink"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400" />
              </a>
              <div
                class="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                aria-labelledby="dropdownMenuLink"
              >
                <div class="dropdown-header">Dropdown Header:</div>
                <a class="dropdown-item" href="/">Action</a>
                <a class="dropdown-item" href="/">Another action</a>
                <div class="dropdown-divider" />
                <a class="dropdown-item" href="/">Something else here</a>
              </div>
            </div>
          </div>
          <!-- Card Body -->
          <div class="card-body">
            <div class="chart-pie pt-4 pb-2">
              <canvas id="pieChart" bind:this={pieCanvas} />
            </div>
            <div class="mt-4 text-center small">
              <span class="mr-2">
                <i class="fas fa-circle text-primary" /> Hotel
              </span>
              <span class="mr-2">
                <i class="fas fa-circle text-success" /> Bar
              </span>
              <span class="mr-2">
                <i class="fas fa-circle text-info" /> Restaurant
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</BaseLayout>
