<script>
  import axios from "axios";
  import { push, link } from "svelte-spa-router";
  import { axiosInstance } from "../interceptors/axios";
  import LoginLayout from "../layouts/loginLayout.svelte";

  let email = "",
    password = "";

  $: submit = async () => {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    console.log({ response });

    if (response.status === 200) {
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.data.accessToken}`;

      localStorage.setItem("authToken", response.data.data.accessToken);
      localStorage.setItem("x-refresh-token", response.data.data.refreshToken);

      await push("/");
    }
  };
</script>

<LoginLayout>
  <div class="container">
    <!-- Outer Row -->
    <div class="row justify-content-center">
      <div class="col-xl-10 col-lg-12 col-md-9">
        <div class="card o-hidden border-0 shadow-lg my-5">
          <div class="card-body p-0">
            <!-- Nested Row within Card Body -->
            <div class="row">
              <!-- <div class="col-lg-6 d-none d-lg-block bg-login-image"></div> -->
              <div class="col-lg-12">
                <div class="p-5">
                  <div class="text-center">
                    <h1 class="h4 text-gray-900 mb-4">Login</h1>
                  </div>
                  <form class="user" on:submit|preventDefault={submit}>
                    <div class="form-group">
                      <input
                        bind:value={email}
                        type="email"
                        class="form-control form-control-user"
                        id="exampleInputEmail"
                        aria-describedby="emailHelp"
                        placeholder="Enter Email Address..."
                      />
                    </div>
                    <button
                      type="submit"
                      class="btn btn-primary btn-user btn-block"
                    >
                      Email me the login link
                    </button>
                  </form>
                  <hr />
                  <div class="text-center">
                    <a class="small" href="/" use:link
                      >Data Privacy Policy</a
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</LoginLayout>

<!-- <main class="form-signin">
    <form on:submit|preventDefault={submit}>
        <h1 class="h3 mb-3 fw-normal">Please sign in</h1>

        <div class="form-floating">
            <input bind:value={email} type="email" class="form-control" placeholder="name@example.com">
            <label>Email address</label>
        </div>

        <div class="form-floating">
            <input bind:value={password} type="password" class="form-control" placeholder="Password">
            <label>Password</label>
        </div>

        <button class="w-100 btn btn-lg btn-primary" type="submit">Submit</button>
    </form>
</main> -->
