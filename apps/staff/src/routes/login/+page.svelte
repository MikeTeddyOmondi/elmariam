<script lang="ts">
  const OPENAUTH_ISSUER = import.meta.env.VITE_OPENAUTH_ISSUER || 'http://localhost:3100';
  const CLIENT_ID = 'staff';
  const REDIRECT_URI = import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/login/callback`
    : 'http://localhost:3001/login/callback';

  async function login() {
    const codeVerifier = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    sessionStorage.setItem('pkce_verifier', codeVerifier);
    document.cookie = `pkce_verifier=${codeVerifier}; path=/; SameSite=Lax; max-age=600`;

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
    <h1>El'Mariam Staff</h1>
    <p>Receptionist, Barista & Waiter portal.</p>
    <button onclick={login}>Sign In</button>
  </div>
</div>

<style>
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #0f3460;
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
  button {
    background: #0f3460;
    color: #fff;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  button:hover { background: #16213e; }
</style>
