import { createClient } from '@openauthjs/openauth/client';
import { subjects } from '@elmariam/auth';
import { redirect } from '@sveltejs/kit';

const OPENAUTH_ISSUER = process.env.OPENAUTH_ISSUER || 'http://openauth:3100';

export const client = createClient({
  clientID: 'elmariam-admin',
  issuer: OPENAUTH_ISSUER,
});

export async function requireManagement(cookies: any) {
  const token = cookies.get('access_token');
  if (!token) throw redirect(302, '/login');

  const result = await client.verify(subjects, token);
  if (result.err) throw redirect(302, '/login');

  const { userType } = result.subject.properties;
  if (userType !== 'management') throw redirect(302, '/login');

  return result.subject.properties;
}
