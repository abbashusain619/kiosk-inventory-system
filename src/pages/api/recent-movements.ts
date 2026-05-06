export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const GET: APIRoute = async () => {
  const movements = rawDb.prepare(`
    SELECT sm.*, p.name as product_name 
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    ORDER BY sm.created_at DESC
    LIMIT 5
  `).all();
  return new Response(JSON.stringify(movements), {
    headers: { 'Content-Type': 'application/json' },
  });
};