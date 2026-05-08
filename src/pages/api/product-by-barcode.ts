export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError, ValidationError } from '../../lib/errors';

export const GET: APIRoute = async ({ url, cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();
  if (!locals.permissions?.includes('sales.create')) {
    throw new ValidationError('Permission denied');
  }

  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  const product = rawDb.prepare(`
    SELECT id, name, price, on_promotion, promo_price, stock
    FROM products
    WHERE (barcode = ? OR sku = ?) AND active = 1
  `).get(code, code) as any;

  if (!product) return new Response('Not found', { status: 404 });

  return new Response(JSON.stringify(product), {
    headers: { 'Content-Type': 'application/json' },
  });
};