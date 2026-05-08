export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError } from '../../lib/errors';

export const GET: APIRoute = async ({ url, cookies }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  const id = Number(url.searchParams.get('id'));
  if (!id) return new Response('Missing product ID', { status: 400 });

  const product = rawDb.prepare('SELECT id, unit, bulk_unit, bulk_factor FROM products WHERE id = ?').get(id) as
    | { id: number; unit: string | null; bulk_unit: string | null; bulk_factor: number | null }
    | undefined;
  if (!product) return new Response('Product not found', { status: 404 });

  return new Response(JSON.stringify({
    id: product.id,
    unit: product.unit || 'piece',
    bulkUnit: product.bulk_unit,
    bulkFactor: product.bulk_factor || 1,
  }), { headers: { 'Content-Type': 'application/json' } });
};