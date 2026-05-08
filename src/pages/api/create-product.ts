export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';

const postHandler: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const data = {
    name: formData.get('name')?.toString(),
    price: Number(formData.get('price')),
    cost_price: formData.get('costPrice') ? Number(formData.get('costPrice')) : null,
    stock: Number(formData.get('stock')),
    min_stock: formData.get('minStock') ? Number(formData.get('minStock')) : 5,
    unit: formData.get('unit')?.toString() || 'piece',
    category_id: formData.get('categoryId') ? Number(formData.get('categoryId')) : null,
    supplier_id: formData.get('supplierId') ? Number(formData.get('supplierId')) : null,
    image_url: formData.get('imageUrl')?.toString() || null,
    on_promotion: formData.get('onPromotion') === '1',
    promo_price: formData.get('promoPrice') ? Number(formData.get('promoPrice')) : null,
  };

  const newProduct = await save('products', data);
  broadcastEvent({ type: 'product-created', product: newProduct });
  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);