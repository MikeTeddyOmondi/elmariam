import { redirect, type RequestHandler } from '@sveltejs/kit';

/**
 * Clears the session and returns to the login page.
 *
 * "Sign out" previously linked straight to `/login`, which starts a fresh
 * authorize flow but leaves `access_token` and `refresh_token` in place. On a
 * shared machine that means the session survived signing out: pressing Back, or
 * opening any guarded route, still worked as the previous user.
 *
 * GET as well as POST, because the sidebar entry is a link. That is a deliberate
 * trade for a destructive-looking verb: the only thing it destroys is the
 * caller's own session, so a cross-site GET to it can log someone out but
 * cannot act as them or read anything.
 */
const signOut: RequestHandler = async ({ cookies }) => {
  for (const name of ['access_token', 'refresh_token', 'pkce_verifier', 'oauth_redirect_uri']) {
    cookies.delete(name, { path: '/' });
  }
  throw redirect(303, '/login');
};

export const GET = signOut;
export const POST = signOut;
