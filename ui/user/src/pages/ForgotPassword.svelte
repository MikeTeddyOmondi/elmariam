<script>
    import axios from 'axios';
    import {push} from 'svelte-spa-router'
    import LoginLayout from '../layouts/loginLayout.svelte'
    import {link} from 'svelte-spa-router';

    let email = '';

    $: submit = async () => {
        console.log({email})

        const response = await axios.post('reset', {
            email
        });

        if (response.status === 200) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            await push('/reset-password');
        }
    }
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
                            <!-- <div class="col-lg-6 d-none d-lg-block bg-password-image"></div> -->
                            <div class="col-lg-12">
                                <div class="p-5">
                                    <div class="text-center">
                                        <h1 class="h4 text-gray-900 mb-2">Forgot Your Password?</h1>
                                        <p class="mb-4">We get it, stuff happens. Just enter your email address below
                                            and we'll send you a link to reset your password!</p>
                                    </div>
                                    <form class="user" on:submit|preventDefault={submit}>
                                        <div class="form-group">
                                            <input bind:value={email} type="email" class="form-control form-control-user"
                                                id="exampleInputEmail" aria-describedby="emailHelp"
                                                placeholder="Enter Email Address...">
                                        </div>
                                        <button type="submit" href="login.html" class="btn btn-primary btn-user btn-block">
                                            Reset Password
                                        </button>
                                    </form>
                                    <hr>
                                    <div class="text-center">
                                        <a class="small" href="/login" use:link>Remember Password?</a>
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
