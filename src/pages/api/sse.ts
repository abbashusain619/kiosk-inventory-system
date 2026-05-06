export const prerender = false;
import type { APIRoute } from 'astro';
import { addClient } from '../../lib/sse';

export const GET: APIRoute = async ({ request }) => {
  const stream = new ReadableStream({
    start(controller) {
      const removeClient = addClient(controller);
      request.signal.addEventListener('abort', removeClient);
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};