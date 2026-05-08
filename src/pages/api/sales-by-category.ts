export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError } from '../../lib/errors';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const rows = rawDb.prepare(`
    SELECT c.name as category, SUM(si.total_price) as total
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    JOIN sale_baskets sb ON si.basket_id = sb.id
    WHERE sb.status = 'completed' AND sb.completed_at >= ?
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT 5
  `).all(thirtyDaysAgo) as { category: string | null; total: number }[];

  // Replace null category with 'Uncategorized'
  const result = rows.map(r => ({
    category: r.category || 'Uncategorized',
    total: r.total
  }));

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};