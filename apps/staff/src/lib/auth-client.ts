import { createClient } from '@openauthjs/openauth/client';
import { env } from '$env/dynamic/public';

export const authClient = createClient({
  clientID: 'staff',
  // Browser-facing issuer URL, read at runtime so one image serves every host.
  issuer: env.PUBLIC_OPENAUTH_ISSUER || 'http://localhost:3100',
});
