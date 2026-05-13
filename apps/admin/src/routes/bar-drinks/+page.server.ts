import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

export const actions = {
  create: async ({ request, cookies }) => {
    const token = cookies.get('access_token');
    if (!token) return fail(401, { error: 'Unauthenticated' });

    const formData = await request.formData();

    const res = await fetch(`${GATEWAY_URL}/api/bar/drinks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await res.text();
    if (!text) return fail(res.status, { error: `HTTP ${res.status}` });

    let data: any;
    try { data = JSON.parse(text); } catch { return fail(500, { error: 'Invalid response from server' }); }

    if (!data.success) return fail(res.status, { error: data.data?.message || data.message || 'Failed to create drink' });
    return { success: true };
  },
} satisfies Actions;
