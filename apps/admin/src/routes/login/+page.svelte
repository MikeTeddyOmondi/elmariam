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
        unauthorized: 'Access restricted to management accounts',
      } as Record<string, string>)[errorParam] ?? decodeURIComponent(errorParam);
    }
  }
</script>

<div class="login-page">
  <div class="card">
    <h1>El'Mariam Admin</h1>
    <p>Management portal access only.</p>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <button onclick={handleLogin} disabled={loading}>
      {loading ? 'Redirecting…' : 'Sign In'}
    </button>
  </div>
</div>

<style>
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1a2e;
  }
  .card {
    background: #fff;
    padding: 2.5rem;
    border-radius: 8px;
    text-align: center;
    min-width: 300px;
  }
  h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
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
</style>
