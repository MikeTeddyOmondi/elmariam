import type { PageServerLoad } from './$types';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8009';

export const load: PageServerLoad = async () => {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/public/menu`);
    const data = await res.json();
    return { menuItems: data.success ? data.data : [] };
  } catch {
    return { menuItems: [] };
  }
};
