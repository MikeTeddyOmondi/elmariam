<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { browser } from '$app/environment';

  let loading = $state(false);
  let error = $state('');

  async function handleRegister() {
    if (!browser) return;
    loading = true;
    error = '';
    try {
      const redirectUri = `${window.location.origin}/login/callback`;
      const { challenge, url } = await authClient.authorize(redirectUri, 'code', { pkce: true });
      document.cookie = `pkce_verifier=${challenge.verifier}; path=/; max-age=600; SameSite=Lax`;
      document.cookie = `oauth_redirect_uri=${encodeURIComponent(redirectUri)}; path=/; max-age=600; SameSite=Lax`;
      window.location.href = url;
    } catch (err) {
      console.error('Register error:', err);
      error = 'Failed to initiate registration. Please try again.';
      loading = false;
    }
  }
</script>

<div class="register-page">
  <div class="card">
    <h1>Create Account</h1>
    <p>Register to book rooms and manage your stays.</p>
    <p class="note">
      You'll be taken to our secure sign-in page — use "Sign up" there to create
      a new account with your email and password.
    </p>

    {#if error}<p class="error">{error}</p>{/if}

    <button onclick={handleRegister} disabled={loading}>
      {loading ? 'Redirecting…' : 'Continue to Registration'}
    </button>

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
    text-align: center;
  }
  h1 { margin: 0 0 0.5rem; color: #1a1a2e; }
  p { color: #666; margin-bottom: 1rem; }
  .note { font-size: 0.85rem; background: #f8f8f8; padding: 0.75rem; border-radius: 4px; text-align: left; }
  .error { color: #c0392b; font-size: 0.875rem; }
  button {
    background: #1a1a2e;
    color: #fff;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    width: 100%;
    margin-top: 0.5rem;
  }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  button:hover:not(:disabled) { background: #16213e; }
  .login { margin-top: 1rem; font-size: 0.9rem; }
  .login a { color: #c0392b; }
</style>
