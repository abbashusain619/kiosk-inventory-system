import type { APIRoute } from 'astro';

export function createApiHandler(handler: APIRoute): APIRoute {
  return async (ctx) => {
    try {
      return await handler(ctx);
    } catch (err: any) {
      console.error('API Error:', err);
      const status = err.status || 500;
      const message = err.message || 'Internal Server Error';
      return new Response(JSON.stringify({ success: false, error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}