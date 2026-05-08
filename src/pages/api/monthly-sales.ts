export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError } from '../../lib/errors';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  const months = 6;
  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    const total = rawDb.prepare(`
      SELECT COALESCE(SUM(final_amount), 0) as total
      FROM sale_baskets
      WHERE status = 'completed' AND completed_at BETWEEN ? AND ?
    `).get(start.getTime(), end.getTime()) as { total: number };
    labels.push(start.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }));
    data.push(total.total);
  }
  return new Response(JSON.stringify({ labels, data }), {
    headers: { 'Content-Type': 'application/json' },
  });
};