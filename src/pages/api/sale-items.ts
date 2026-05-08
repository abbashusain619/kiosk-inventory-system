export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError, ValidationError } from '../../lib/errors';

export const GET: APIRoute = async ({ url, cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  if (!locals.permissions?.includes('sales.view')) {
    throw new ValidationError('You do not have permission to view sale details');
  }

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