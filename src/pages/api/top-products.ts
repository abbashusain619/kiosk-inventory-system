export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError } from '../../lib/errors';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const rows = rawDb.prepare(`
    SELECT p.name, SUM(si.quantity) as total_qty
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sale_baskets sb ON si.basket_id = sb.id
    WHERE sb.status = 'completed' AND sb.completed_at >= ?
    GROUP BY p.id
    ORDER BY total_qty DESC
    LIMIT 5
  `).all(thirtyDaysAgo) as { name: string; total_qty: number }[];

  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' },
  });
};