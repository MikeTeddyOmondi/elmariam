import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { createClient } from '@openauthjs/openauth/client';
import { subjects } from '$lib/subjects';
import type { RequestHandler } from './$types';

const client = createClient({
  clientID: 'admin',
  issuer: process.env.OPENAUTH_ISSUER || 'http://openauth:3100',
});

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  if (errorParam) throw redirect(302, `/login?error=${errorParam}`);
  if (!code) throw redirect(302, '/login?error=no_code');

  const verifier = cookies.get('pkce_verifier');
  if (!verifier) throw redirect(302, '/login?error=no_verifier');

  const redirectUri = `${url.origin}/login/callback`;
  const result = await client.exchange(code, redirectUri, verifier);

  if (result.err) {
    console.error('Token exchange error:', result.err);
    throw redirect(302, '/login?error=exchange_failed');
  }

  const verified = await client.verify(subjects, result.tokens.access);
  if (verified.err || verified.subject.properties.userType !== 'management') {
    throw redirect(302, '/login?error=unauthorized');
  }

  const opts = { path: '/', httpOnly: true, secure: !dev, sameSite: 'lax' as const };
  cookies.set('access_token', result.tokens.access, { ...opts, maxAge: 60 * 60 * 24 * 7 });
  cookies.set('refresh_token', result.tokens.refresh, { ...opts, maxAge: 60 * 60 * 24 * 30 });
  cookies.delete('pkce_verifier', { path: '/' });

  throw redirect(302, '/');
};
