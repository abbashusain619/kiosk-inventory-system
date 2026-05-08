export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb, db } from '../../db';
import { products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) return new Response('Unauthorized', { status: 401 });

  // Permission check
  if (!locals.permissions?.includes('sales.create')) {
    throw new ValidationError('You do not have permission to create sales');
  }

  const userId = locals.user?.id || 1;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { items, discountType, discountValue, finalAmount } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('No items in sale');
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const now = Date.now();

  const basketStmt = rawDb.prepare(`
    INSERT INTO sale_baskets (total_amount, discount_type, discount_value, final_amount, status, completed_at, user_id)
    VALUES (?, ?, ?, ?, 'completed', ?, ?)
  `);
  const basketResult = basketStmt.run(subtotal, discountType || null, discountValue || 0, finalAmount, now, userId);
  const basketId = basketResult.lastInsertRowid;

  for (const item of items) {
    const itemStmt = rawDb.prepare(`
      INSERT INTO sale_items (basket_id, product_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `);
    itemStmt.run(basketId, item.productId, item.quantity, item.unitPrice, item.quantity * item.unitPrice);

    const movementStmt = rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, total_price, created_at, user_id)
      VALUES (?, 'out', ?, 'sale', ?, ?, ?)
    `);
    movementStmt.run(item.productId, item.quantity, item.quantity * item.unitPrice, now, userId);

    const product = await db.select().from(products).where(eq(products.id, item.productId)).get();
    if (product) {
      const newStock = product.stock - item.quantity;
      await db.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
      broadcastEvent({ type: 'stock-update', productId: item.productId, stock: newStock });
    }
  }

  broadcastEvent({ type: 'sale-completed', basketId, finalAmount });
  return new Response('OK', { status: 200 });
};