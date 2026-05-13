import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';

export function getAuthToken(cookies: Cookies): string | null {
  return cookies.get('access_token') ?? null;
}

export function requireCustomerAuth(cookies: Cookies): string {
  const token = cookies.get('access_token');
  if (!token) redirect(302, '/login');
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.properties?.userType !== 'customer') redirect(302, '/login');
    return token;
  } catch {
    redirect(302, '/login');
  }
}
