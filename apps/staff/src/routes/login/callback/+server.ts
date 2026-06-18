import { dev } from '$app/environment';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@openauthjs/openauth/client';
import { subjects } from '$lib/subjects';

const STAFF_TYPES = ['receptionist', 'barista', 'waiter', 'management'];

const client = createClient({
  clientID: 'staff',
  issuer: process.env.OPENAUTH_ISSUER || 'http://openauth:3100',
});

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  if (errorParam) throw redirect(302, `/login?error=${errorParam}`);
  if (!code) throw redirect(302, '/login?error=no_code');

  const verifier = cookies.get('pkce_verifier');
  if (!verifier) throw redirect(302, '/login?error=no_verifier');

  const storedRedirectUri = cookies.get('oauth_redirect_uri');
  if (!storedRedirectUri) throw redirect(302, '/login?error=no_redirect_uri');
  const redirectUri = decodeURIComponent(storedRedirectUri);

  let result;
  try {
    result = await client.exchange(code, redirectUri, verifier);
  } catch (err) {
    console.error('[staff callback] exchange threw:', err);
    throw redirect(302, '/login?error=exchange_failed');
  }

  if (result.err) {
    console.error('[staff callback] exchange error:', result.err);
    throw redirect(302, '/login?error=exchange_failed');
  }

  const verified = await client.verify(subjects, result.tokens.access);
  if (verified.err || !('subject' in verified) || !STAFF_TYPES.includes(verified.subject.properties.userType)) {
    throw redirect(302, '/login?error=unauthorized');
  }

  const userType = verified.subject.properties.userType;
  const opts = { path: '/', httpOnly: true, secure: !dev, sameSite: 'lax' as const };
  cookies.set('access_token', result.tokens.access, { ...opts, maxAge: 60 * 60 * 24 * 7 });
  cookies.set('refresh_token', result.tokens.refresh, { ...opts, maxAge: 60 * 60 * 24 * 30 });
  cookies.set('user_type', userType, {
    path: '/', httpOnly: false, secure: !dev, sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 7,
  });
  cookies.delete('pkce_verifier', { path: '/' });
  cookies.delete('oauth_redirect_uri', { path: '/' });

  throw redirect(302, '/');
};
