export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save, findById } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();
  const userId = locals.user?.id || 1;

  // Permission check
  if (!locals.permissions?.includes('sales.create')) {
    throw new ValidationError('You do not have permission to create sales');
  }

  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const quantity = Number(formData.get('quantity'));
  const usePromo = formData.get('usePromo') === '1';

  if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
    throw new ValidationError('Invalid product ID or quantity');
  }

  const product = await findById('products', productId);
  if (!product) throw new NotFoundError('Product not found');
  if (product.stock < quantity) {
    throw new ValidationError(`Insufficient stock. Only ${product.stock} available.`);
  }

  // Determine selling price (use promo price if enabled and lower)
  const finalPrice = (usePromo && product.on_promotion && product.promo_price && product.promo_price < product.price)
    ? product.promo_price
    : product.price;
  const totalAmount = finalPrice * quantity;
  const now = Date.now();

  // Create sale basket
  const basketData = {
    total_amount: totalAmount,
    final_amount: totalAmount,
    status: 'completed',
    completed_at: now,
    user_id: userId,
  };
  const basket = await save('sale_baskets', basketData);
  const basketId = basket.id;

  // Create sale item
  const saleItemData = {
    basket_id: basketId,
    product_id: productId,
    quantity,
    unit_price: finalPrice,
    total_price: totalAmount,
  };
  await save('sale_items', saleItemData);

  // Record stock movement (out)
  const movementData = {
    product_id: productId,
    type: 'out',
    quantity,
    reason: 'sale',
    total_price: totalAmount,
    created_at: now,
    user_id: userId,
  };
  await save('stock_movements', movementData);

  // Update product stock
  const newStock = product.stock - quantity;
  await save('products', { id: productId, stock: newStock });

  broadcastEvent({ type: 'stock-update', productId, stock: newStock });

  return redirect('/admin/products?sold=1');
};

export const POST = createApiHandler(postHandler);