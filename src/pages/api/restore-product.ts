export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save, findById } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('products.edit')) {
    throw new ValidationError('You do not have permission to restore products');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  if (!id) throw new ValidationError('Product ID required');

  const product = await findById('products', id);
  if (!product) throw new ValidationError('Product not found');

  product.active = true;

  await save('products', product);

  broadcastEvent({
    type: 'product-updated',
    productId: id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    unit: product.unit,
    categoryId: product.category_id,
    supplierId: product.supplier_id,
    imageUrl: product.image_url,
    costPrice: product.cost_price,
    onPromotion: product.on_promotion,
    promoPrice: product.promo_price,
    active: true,
  });

  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);