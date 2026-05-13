<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { browser } from '$app/environment';
  import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertDescription } from '@elmariam/ui';
  import { Loader2 } from 'lucide-svelte';

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
      document.cookie = `oauth_redirect_uri=${encodeURIComponent(redirectUri)}; path=/; max-age=600; SameSite=Lax`;
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
        no_code: 'No authorization code received.',
        no_verifier: 'Session expired — please try again.',
        no_redirect_uri: 'Session expired — please try again.',
        exchange_failed: 'Failed to exchange authorization code.',
        unauthorized: 'Access restricted to staff accounts.',
      } as Record<string, string>)[errorParam] ?? decodeURIComponent(errorParam);
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <Card class="w-full max-w-sm">
    <CardHeader class="space-y-1 text-center">
      <CardTitle class="text-2xl">El'Mariam</CardTitle>
      <CardDescription>Staff portal — sign in to continue</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if error}
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      {/if}
      <Button onclick={handleLogin} disabled={loading} class="w-full">
        {#if loading}
          <Loader2 class="mr-2 size-4 animate-spin" />
          Redirecting…
        {:else}
          Sign In
        {/if}
      </Button>
    </CardContent>
  </Card>
</div>
