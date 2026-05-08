export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save, findById } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

const postHandler: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('products.edit')) {
    throw new ValidationError('You do not have permission to restore products');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  if (!id) throw new ValidationError('Product ID required');

  // Fetch product before restore (old state)
  let oldProduct = await findById('products', id);
  if (!oldProduct) throw new ValidationError('Product not found');

  // Convert integer flags (0/1) to booleans for Zod validation
  oldProduct = {
    ...oldProduct,
    on_promotion: oldProduct.on_promotion === 1,
    active: oldProduct.active === 1,
  };

  // Restore: set active = true
  const restored = { ...oldProduct, active: true };
  await save('products', restored);

  // Broadcast update (use camelCase for frontend)
  broadcastEvent({
    type: 'product-updated',
    productId: id,
    name: restored.name,
    price: restored.price,
    stock: restored.stock,
    unit: restored.unit,
    categoryId: restored.category_id,
    supplierId: restored.supplier_id,
    imageUrl: restored.image_url,
    costPrice: restored.cost_price,
    onPromotion: restored.on_promotion,
    promoPrice: restored.promo_price,
    active: true,
  });

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'RESTORE', 'products', id, { active: false }, { active: true });
  }

  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);