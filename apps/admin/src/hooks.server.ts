import { dev } from '$app/environment';
import { createClient } from '@openauthjs/openauth/client';
import { subjects } from '$lib/subjects';
import type { Handle } from '@sveltejs/kit';

const client = createClient({
  clientID: 'admin',
  issuer: process.env.OPENAUTH_ISSUER || 'http://openauth:3100',
});

export const handle: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get('access_token');
  const refreshToken = event.cookies.get('refresh_token');

  if (accessToken) {
    try {
      const verified = await client.verify(subjects, accessToken, {
        refresh: refreshToken,
      });

      if (!verified.err) {
        event.locals.user = verified.subject.properties;

        if (verified.tokens) {
          const opts = { path: '/', httpOnly: true, secure: !dev, sameSite: 'lax' as const };
          event.cookies.set('access_token', verified.tokens.access, { ...opts, maxAge: 60 * 60 * 24 * 7 });
          event.cookies.set('refresh_token', verified.tokens.refresh, { ...opts, maxAge: 60 * 60 * 24 * 30 });
        }
      }
    } catch {
      event.cookies.delete('access_token', { path: '/' });
      event.cookies.delete('refresh_token', { path: '/' });
    }
  }

  return resolve(event);
};
