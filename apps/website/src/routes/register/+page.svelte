<script lang="ts">
  const OPENAUTH_ISSUER = import.meta.env.VITE_OPENAUTH_ISSUER || 'http://localhost:3100';
  const CLIENT_ID = 'website';
  const REDIRECT_URI = import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/login/callback`
    : 'http://localhost:3002/login/callback';

  let email = $state('');
  let password = $state('');
  let error = $state('');

  async function register(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    try {
      const res = await fetch(`${OPENAUTH_ISSUER}/password/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, client_id: CLIENT_ID, redirect_uri: REDIRECT_URI }),
      });
      const data = await res.json();
      if (data.error) { error = data.error; return; }
      window.location.href = '/login';
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<div class="register-page">
  <div class="card">
    <h1>Create Account</h1>
    <p>Register to book rooms and manage your stays.</p>

    {#if error}<p class="error">{error}</p>{/if}

    <form onsubmit={register} class="form">
      <label>Email <input type="email" bind:value={email} required /></label>
      <label>Password <input type="password" bind:value={password} minlength="8" required /></label>
      <button type="submit">Register</button>
    </form>

    <p class="login">Already have an account? <a href="/login">Sign in</a></p>
  </div>
</div>

<style>
  .register-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem;
  }
  .card {
    background: #fff;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    min-width: 320px;
  }
  h1 { margin: 0 0 0.5rem; color: #1a1a2e; }
  p { color: #666; margin-bottom: 1rem; }
  .form { display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; color: #555; }
  input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
  button { background: #1a1a2e; color: #fff; border: none; padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .login { text-align: center; margin-top: 1rem; font-size: 0.9rem; }
  .login a { color: #c0392b; }
  .error { color: red; font-size: 0.9rem; }
</style>
