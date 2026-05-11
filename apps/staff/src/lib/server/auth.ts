import { createClient } from '@openauthjs/openauth/client';
import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';

const OPENAUTH_ISSUER = process.env.OPENAUTH_ISSUER || 'http://openauth:3100';

const client = createClient({ clientID: 'staff', issuer: OPENAUTH_ISSUER });

export type StaffUserType = 'receptionist' | 'barista' | 'waiter' | 'management';

export async function requireStaffAuth(cookies: Cookies): Promise<{ id: string; email: string; userType: StaffUserType }> {
  const token = cookies.get('auth_token');
  if (!token) redirect(302, '/login');
  try {
    const verified = await client.verify(token as any, token);
    const { id, email, userType } = verified.subject.properties as any;
    if (!['receptionist', 'barista', 'waiter', 'management'].includes(userType)) {
      redirect(302, '/login');
    }
    return { id, email, userType };
  } catch {
    redirect(302, '/login');
  }
}
