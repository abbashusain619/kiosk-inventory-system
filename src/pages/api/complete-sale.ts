export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb, db } from '../../db';
import { products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) return new Response('Unauthorized', { status: 401 });

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
  const basketId = Number(basketResult.lastInsertRowid);

  // Log basket creation
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'CREATE', 'sale_baskets', basketId, null, {
      total_amount: subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      final_amount: finalAmount,
      user_id: userId,
      completed_at: now
    });
  }

  for (const item of items) {
    const itemStmt = rawDb.prepare(`
      INSERT INTO sale_items (basket_id, product_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `);
    const itemResult = itemStmt.run(basketId, item.productId, item.quantity, item.unitPrice, item.quantity * item.unitPrice);
    const saleItemId = Number(itemResult.lastInsertRowid);

    // Log sale item
    if (locals.user?.id) {
      await logAudit(locals.user.id, 'CREATE', 'sale_items', saleItemId, null, {
        basket_id: basketId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      });
    }

    const movementStmt = rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, total_price, created_at, user_id)
      VALUES (?, 'out', ?, 'sale', ?, ?, ?)
    `);
    const movementResult = movementStmt.run(item.productId, item.quantity, item.quantity * item.unitPrice, now, userId);
    const movementId = Number(movementResult.lastInsertRowid);

    // Log stock movement
    if (locals.user?.id) {
      await logAudit(locals.user.id, 'CREATE', 'stock_movements', movementId, null, {
        product_id: item.productId,
        type: 'out',
        quantity: item.quantity,
        reason: 'sale',
        total_price: item.quantity * item.unitPrice,
        user_id: userId,
        created_at: now
      });
    }

    const product = await db.select().from(products).where(eq(products.id, item.productId)).get();
    if (product) {
      const oldStock = product.stock;
      const newStock = oldStock - item.quantity;
      await db.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
      broadcastEvent({ type: 'stock-update', productId: item.productId, stock: newStock });

      // Log stock update (optional, but could be logged in a separate audit)
      // We'll skip because the stock movement already captures the change.
    }
  }

  broadcastEvent({ type: 'sale-completed', basketId, finalAmount });
  return new Response('OK', { status: 200 });
};