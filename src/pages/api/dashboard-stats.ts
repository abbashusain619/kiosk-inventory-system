export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const GET: APIRoute = async () => {
  try {
    const totalProducts = rawDb.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get() as { count: number };
    const lowStockCount = rawDb.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock < min_stock').get() as { count: number };
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Use single quotes around 'completed'
    const todaySales = rawDb.prepare("SELECT COALESCE(SUM(final_amount), 0) as total FROM sale_baskets WHERE status = 'completed' AND completed_at BETWEEN ? AND ?")
      .get(todayStart.getTime(), todayEnd.getTime()) as { total: number };
    
    const inventoryValue = rawDb.prepare("SELECT COALESCE(SUM(stock * cost_price), 0) as total FROM products WHERE active = 1 AND cost_price IS NOT NULL AND cost_price > 0")
      .get() as { total: number };

    const result = {
      totalProducts: totalProducts.count,
      lowStockCount: lowStockCount.count,
      todaySales: todaySales.total,
      inventoryValue: inventoryValue.total,
    };
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};