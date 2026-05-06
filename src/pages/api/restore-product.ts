export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save, findById } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  if (!id) throw new ValidationError('Product ID required');

  // Fetch current product (all fields, with database values)
  const product = await findById('products', id);
  if (!product) throw new ValidationError(`Product not found with id ${id}`);

  // Convert database boolean flags (0/1) to actual booleans
  product.on_promotion = product.on_promotion === 1;
  product.active = true; // force active

  // Ensure cost_price and promo_price are numbers or null
  if (product.cost_price === undefined) product.cost_price = null;
  if (product.promo_price === undefined) product.promo_price = null;
  if (product.image_url === undefined) product.image_url = null;
  if (product.category_id === undefined) product.category_id = null;
  if (product.supplier_id === undefined) product.supplier_id = null;

  // Save the full product (validation will pass)
  await save('products', product);

  // Broadcast the restored product in camelCase
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