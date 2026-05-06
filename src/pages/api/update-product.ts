export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';

const postHandler: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const data = {
    id,
    name: formData.get('name')?.toString(),
    price: Number(formData.get('price')),
    cost_price: formData.get('costPrice') ? Number(formData.get('costPrice')) : null,
    stock: Number(formData.get('stock')),
    unit: formData.get('unit')?.toString() || 'piece',
    category_id: formData.get('categoryId') ? Number(formData.get('categoryId')) : null,
    supplier_id: formData.get('supplierId') ? Number(formData.get('supplierId')) : null,
    image_url: formData.get('imageUrl')?.toString() || null,
    on_promotion: formData.get('onPromotion') === '1',
    promo_price: formData.get('promoPrice') ? Number(formData.get('promoPrice')) : null,
    active: formData.get('active') === '1',  // important: reactivate product on edit
  };

  const updated = await save('products', data);
  
  broadcastEvent({
    type: 'product-updated',
    productId: updated.id,
    name: updated.name,
    price: updated.price,
    stock: updated.stock,
    unit: updated.unit,
    categoryId: updated.category_id,
    supplierId: updated.supplier_id,
    imageUrl: updated.image_url,
    costPrice: updated.cost_price,
    onPromotion: updated.on_promotion,
    promoPrice: updated.promo_price,
    active: updated.active,           // send active flag to customer
  });
  
  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);