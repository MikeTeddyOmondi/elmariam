import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const OPENAUTH_ISSUER = process.env.OPENAUTH_ISSUER || 'http://openauth:3100';
const CLIENT_ID = 'staff';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const REDIRECT_URI = `${BASE_URL}/login/callback`;

const STAFF_TYPES = ['receptionist', 'barista', 'waiter', 'management'];

export const load: PageServerLoad = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const codeVerifier = url.searchParams.get('code_verifier') || cookies.get('pkce_verifier');

  if (!code) redirect(302, '/login');

  try {
    const res = await fetch(`${OPENAUTH_ISSUER}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        code_verifier: codeVerifier || '',
      }),
    });

    const tokenData = await res.json();
    if (!tokenData.access_token) redirect(302, '/login');

    const payload = JSON.parse(atob(tokenData.access_token.split('.')[1]));
    const userType = payload.properties?.userType;
    if (!STAFF_TYPES.includes(userType)) redirect(302, '/login');

    cookies.set('auth_token', tokenData.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });
    cookies.set('user_type', userType, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });
  } catch {
    redirect(302, '/login');
  }

  redirect(302, '/');
};
