<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { browser } from '$app/environment';
  import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertDescription } from '@elmariam/ui';
  import { Loader2 } from 'lucide-svelte';

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

<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <Card class="w-full max-w-sm">
    <CardHeader class="space-y-1 text-center">
      <CardTitle class="text-2xl">Create Account</CardTitle>
      <CardDescription>Register to book rooms and manage your stays</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-sm text-muted-foreground bg-secondary rounded-md px-3 py-2">
        You'll be taken to our secure sign-in page — use "Sign up" there to create
        a new account with your email and password.
      </p>
      {#if error}
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      {/if}
      <Button onclick={handleRegister} disabled={loading} class="w-full">
        {#if loading}
          <Loader2 class="mr-2 size-4 animate-spin" />
          Redirecting…
        {:else}
          Continue to Registration
        {/if}
      </Button>
      <p class="text-center text-sm text-muted-foreground">
        Already have an account?
        <a href="/login" class="text-accent hover:underline">Sign in</a>
      </p>
    </CardContent>
  </Card>
</div>
