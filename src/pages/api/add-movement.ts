export const prerender = false;
import type { APIRoute } from 'astro';
import { db, rawDb } from '../../db';
import { products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) return redirect('/admin/login');
  const userId = locals.user?.id || 1;

  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const type = formData.get('type') as string;
  let quantity = Number(formData.get('quantity'));
  const totalCost = formData.get('totalCost') ? Number(formData.get('totalCost')) : null;
  const supplierId = formData.get('supplierId') ? Number(formData.get('supplierId')) : null;
  const reason = formData.get('reason')?.toString() || (type === 'in' ? 'purchase' : 'adjustment');

  if (isNaN(productId)) throw new ValidationError('Invalid product ID');

  const product = await db.select().from(products).where(eq(products.id, productId)).get();
  if (!product) throw new ValidationError('Product not found');

  let newStock = product.stock;
  let movementId = null;

  // Handle cost correction separately
  if (type === 'cost_correction') {
    if (!locals.permissions?.includes('stock.adjust')) {
      throw new ValidationError('You do not have permission to adjust cost');
    }
    const newCost = Number(formData.get('newCost'));
    if (isNaN(newCost) || newCost <= 0) throw new ValidationError('Invalid new cost');

    const oldCost = product.costPrice; // FIXED: use camelCase
    // Update product's cost_price (raw SQL uses snake_case)
    rawDb.prepare('UPDATE products SET cost_price = ? WHERE id = ?').run(newCost, productId);
    
    // Record movement
    const moveStmt = rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, total_cost, created_at, user_id)
      VALUES (?, 'adjustment', 0, 'cost_correction', ?, ?, ?)
    `);
    const moveResult = moveStmt.run(productId, newCost * product.stock, Date.now(), userId);
    movementId = Number(moveResult.lastInsertRowid);
    
    broadcastEvent({ type: 'cost-updated', productId, newCost });

    if (locals.user?.id) {
      await logAudit(locals.user.id, 'UPDATE_COST', 'products', productId, { cost_price: oldCost }, { cost_price: newCost });
      await logAudit(locals.user.id, 'CREATE', 'stock_movements', movementId, null, {
        product_id: productId,
        type: 'adjustment',
        quantity: 0,
        reason: 'cost_correction',
        total_cost: newCost * product.stock,
        user_id: userId
      });
    }
    return redirect('/admin/transactions?added=1');
  }

  // Permission checks for other types
  if (type === 'in' && !locals.permissions?.includes('stock.in')) {
    throw new ValidationError('You do not have permission to record stock purchases');
  }
  if (type === 'adjustment' && !locals.permissions?.includes('stock.adjust')) {
    throw new ValidationError('You do not have permission to record stock adjustments');
  }

  if (isNaN(quantity)) throw new ValidationError('Invalid quantity');

  let movementResult;
  if (type === 'in') {
    if (quantity <= 0) throw new ValidationError('Quantity must be positive for purchase');
    newStock = product.stock + quantity;
    const stmt = rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, total_cost, supplier_id, created_at, user_id)
      VALUES (?, 'in', ?, ?, ?, ?, ?, ?)
    `);
    movementResult = stmt.run(productId, quantity, reason, totalCost, supplierId, Date.now(), userId);
    movementId = Number(movementResult.lastInsertRowid);
  } 
  else if (type === 'adjustment') {
    newStock = product.stock + quantity;
    const stmt = rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, created_at, user_id)
      VALUES (?, 'adjustment', ?, ?, ?, ?)
    `);
    movementResult = stmt.run(productId, quantity, reason, Date.now(), userId);
    movementId = Number(movementResult.lastInsertRowid);
  }
  else {
    throw new ValidationError('Invalid type');
  }

  await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
  broadcastEvent({ type: 'stock-update', productId, stock: newStock });

  if (locals.user?.id && movementId) {
    await logAudit(locals.user.id, 'CREATE', 'stock_movements', movementId, null, {
      product_id: productId,
      type,
      quantity,
      reason,
      total_cost: totalCost,
      supplier_id: supplierId,
      user_id: userId,
      new_stock: newStock
    });
  }

  return redirect('/admin/transactions?added=1');
};