export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const GET: APIRoute = async ({ url }) => {
  const basketId = url.searchParams.get('basketId');
  if (!basketId) return new Response('Missing basketId', { status: 400 });

  const items = rawDb.prepare(`
    SELECT si.*, p.name as product_name
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.basket_id = ?
  `).all(Number(basketId));

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};