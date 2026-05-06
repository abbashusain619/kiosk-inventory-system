export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session')?.value;
  if (sessionId) {
    // optional: delete from database
  }
  cookies.delete('session', { path: '/' });
  return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
};