<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { browser } from '$app/environment';

  let loading = $state(false);
  let error = $state('');

  async function handleLogin() {
    if (!browser) return;
    loading = true;
    error = '';
    try {
      const redirectUri = `${window.location.origin}/login/callback`;
      const { challenge, url } = await authClient.authorize(redirectUri, 'code', { pkce: true });
      document.cookie = `pkce_verifier=${challenge.verifier}; path=/; max-age=600; SameSite=Lax`;
      window.location.href = url;
    } catch (err) {
      console.error('Login error:', err);
      error = 'Failed to initiate login. Please try again.';
      loading = false;
    }
  }

  if (browser) {
    const errorParam = new URLSearchParams(window.location.search).get('error');
    if (errorParam) {
      error = ({
        no_code: 'No authorization code received',
        no_verifier: 'Session expired, please try again',
        exchange_failed: 'Failed to exchange authorization code',
        unauthorized: 'Access restricted to customer accounts',
      } as Record<string, string>)[errorParam] ?? decodeURIComponent(errorParam);
    }
  }
</script>

<div class="login-page">
  <div class="card">
    <h1>Sign In</h1>
    <p>Access your bookings and manage your stay.</p>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <button onclick={handleLogin} disabled={loading}>
      {loading ? 'Redirecting…' : 'Continue with El\'Mariam Account'}
    </button>
    <p class="register">Don't have an account? <a href="/register">Register</a></p>
  </div>
</div>

<style>
  .login-page {
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
    text-align: center;
    min-width: 320px;
  }
  h1 { margin: 0 0 0.5rem; color: #1a1a2e; }
  p { color: #666; margin-bottom: 1.5rem; }
  .error { color: #c0392b; font-size: 0.875rem; margin-bottom: 1rem; }
  button {
    background: #1a1a2e;
    color: #fff;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    width: 100%;
  }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  button:hover:not(:disabled) { background: #16213e; }
  .register { margin-top: 1rem; font-size: 0.9rem; }
  .register a { color: #c0392b; }
</style>
