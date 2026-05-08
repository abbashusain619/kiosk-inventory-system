export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError, ValidationError } from '../../lib/errors';

export const GET: APIRoute = async ({ url, cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  if (!locals.permissions?.includes('sales.view')) {
    throw new ValidationError('You do not have permission to view sales history');
  }

  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let fromTimestamp: number;
  let toTimestamp: number;

  if (from && to) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    fromTimestamp = fromDate.getTime();
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    toTimestamp = toDate.getTime();
  } else {
    // Default to last 30 days
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    fromTimestamp = start.getTime();
    toTimestamp = now.getTime();
  }

  const sales = rawDb.prepare(`
    SELECT 
      sb.id,
      sb.total_amount,
      sb.discount_type,
      sb.discount_value,
      sb.final_amount,
      sb.completed_at,
      COUNT(si.id) as item_count
    FROM sale_baskets sb
    LEFT JOIN sale_items si ON sb.id = si.basket_id
    WHERE sb.status = 'completed'
      AND sb.completed_at BETWEEN ? AND ?
    GROUP BY sb.id
    ORDER BY sb.completed_at DESC
  `).all(fromTimestamp, toTimestamp) as any[];

  return new Response(JSON.stringify(sales), {
    headers: { 'Content-Type': 'application/json' },
  });
};