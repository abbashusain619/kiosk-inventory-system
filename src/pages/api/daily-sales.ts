export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { UnauthorizedError } from '../../lib/errors';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();

  const days = 7;
  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const total = rawDb.prepare(`
      SELECT COALESCE(SUM(final_amount), 0) as total
      FROM sale_baskets
      WHERE status = 'completed' AND completed_at BETWEEN ? AND ?
    `).get(date.getTime(), nextDay.getTime()) as { total: number };
    labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    data.push(total.total);
  }
  return new Response(JSON.stringify({ labels, data }), {
    headers: { 'Content-Type': 'application/json' },
  });
};