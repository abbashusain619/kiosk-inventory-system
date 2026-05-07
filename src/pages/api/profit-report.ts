export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

type ProfitRow = {
  id: number;
  name: string;
  quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  profit: number;
};

type Summary = {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
};

export const GET: APIRoute = async ({ url }) => {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let fromDate = from ? new Date(from) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  let toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const rows = rawDb.prepare(`
    SELECT 
      p.id,
      p.name,
      SUM(sm.quantity) as quantity_sold,
      SUM(sm.total_price) as total_revenue,
      (p.cost_price * SUM(sm.quantity)) as total_cost,
      (SUM(sm.total_price) - (p.cost_price * SUM(sm.quantity))) as profit
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE sm.type = 'out' 
      AND sm.reason = 'sale'
      AND sm.created_at BETWEEN ? AND ?
    GROUP BY p.id
    ORDER BY profit DESC
  `).all(fromDate.getTime(), toDate.getTime()) as ProfitRow[];

  const totalProfit = rows.reduce((sum, r) => sum + (r.profit || 0), 0);
  const totalRevenue = rows.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
  const totalCost = rows.reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const summary: Summary = { totalRevenue, totalCost, totalProfit };

  return new Response(JSON.stringify({ rows, summary }), {
    headers: { 'Content-Type': 'application/json' },
  });
};