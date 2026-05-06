export const prerender = false;
import type { APIRoute } from 'astro';
import { db, rawDb } from '../../db';
import { products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent } from '../../lib/sse';

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) return redirect('/admin/login');
  const userId = locals.userId || 1;

  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const type = formData.get('type') as string;
  let quantity = Number(formData.get('quantity'));
  const totalCost = formData.get('totalCost') ? Number(formData.get('totalCost')) : null;
  const supplierId = formData.get('supplierId') ? Number(formData.get('supplierId')) : null;
  const reason = formData.get('reason')?.toString() || (type === 'in' ? 'purchase' : 'adjustment');

  if (isNaN(productId) || isNaN(quantity)) {
    return new Response('Invalid data', { status: 400 });
  }

  const product = await db.select().from(products).where(eq(products.id, productId)).get();
  if (!product) return new Response('Product not found', { status: 404 });

  let newStock = product.stock;

  if (type === 'in') {
    if (quantity <= 0) return new Response('Quantity must be positive for purchase', { status: 400 });
    newStock = product.stock + quantity;
    rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, total_cost, supplier_id, created_at, user_id)
      VALUES (?, 'in', ?, ?, ?, ?, ?, ?)
    `).run(productId, quantity, reason, totalCost, supplierId, Date.now(), userId);
  } 
  else if (type === 'adjustment') {
    newStock = product.stock + quantity;
    rawDb.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, created_at, user_id)
      VALUES (?, 'adjustment', ?, ?, ?, ?)
    `).run(productId, quantity, reason, Date.now(), userId);
  }
  else {
    return new Response('Invalid type', { status: 400 });
  }

  await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
  broadcastEvent({ type: 'stock-update', productId, stock: newStock });

  return redirect('/admin/transactions?added=1');
};