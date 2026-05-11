<script lang="ts">
  const OPENAUTH_ISSUER = import.meta.env.VITE_OPENAUTH_ISSUER || 'http://localhost:3100';
  const CLIENT_ID = 'website';
  const REDIRECT_URI = import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/login/callback`
    : 'http://localhost:3002/login/callback';

  async function login() {
    const codeVerifier = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    sessionStorage.setItem('pkce_verifier', codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${OPENAUTH_ISSUER}/authorize?${params}`;
  }
</script>

<div class="login-page">
  <div class="card">
    <h1>Sign In</h1>
    <p>Access your bookings and manage your stay.</p>
    <button onclick={login}>Continue with El'Mariam Account</button>
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
  .register { margin-top: 1rem; font-size: 0.9rem; }
  .register a { color: #c0392b; }
</style>
