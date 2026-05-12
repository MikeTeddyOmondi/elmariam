import { createClient } from '@openauthjs/openauth/client';

export const authClient = createClient({
  clientID: 'staff',
  issuer: import.meta.env.VITE_OPENAUTH_ISSUER || 'http://localhost:3100',
});
