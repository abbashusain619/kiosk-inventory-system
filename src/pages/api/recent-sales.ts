export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const GET: APIRoute = async () => {
  const sales = rawDb.prepare(`
    SELECT sb.id, sb.final_amount, sb.completed_at, 
           COUNT(si.id) as item_count
    FROM sale_baskets sb
    LEFT JOIN sale_items si ON sb.id = si.basket_id
    WHERE sb.status = 'completed'
    GROUP BY sb.id
    ORDER BY sb.completed_at DESC
    LIMIT 5
  `).all();
  return new Response(JSON.stringify(sales), {
    headers: { 'Content-Type': 'application/json' },
  });
};