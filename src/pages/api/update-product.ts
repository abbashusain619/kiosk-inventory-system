export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save, findById } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

const postHandler: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('products.edit')) {
    throw new ValidationError('You do not have permission to edit products');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));

  // Fetch old product data
  const oldProduct = await findById('products', id);
  if (!oldProduct) throw new ValidationError('Product not found');

  const data = {
    id,
    name: formData.get('name')?.toString(),
    sku: formData.get('sku')?.toString() || '',
    barcode: formData.get('barcode')?.toString() || null,
    price: Number(formData.get('price')),
    cost_price: formData.get('costPrice') ? Number(formData.get('costPrice')) : null,
    stock: Number(formData.get('stock')),
    min_stock: formData.get('minStock') ? Number(formData.get('minStock')) : 5,
    unit: formData.get('unit')?.toString() || 'piece',
    bulk_unit: formData.get('bulkUnit')?.toString() || null,
    bulk_factor: formData.get('bulkFactor') ? Number(formData.get('bulkFactor')) : 1,
    category_id: formData.get('categoryId') ? Number(formData.get('categoryId')) : null,
    supplier_id: formData.get('supplierId') ? Number(formData.get('supplierId')) : null,
    image_url: formData.get('imageUrl')?.toString() || null,
    on_promotion: formData.get('onPromotion') === '1',
    promo_price: formData.get('promoPrice') ? Number(formData.get('promoPrice')) : null,
    active: formData.get('active') === '1',
  };

  const updated = await save('products', data);
  broadcastEvent({
    id,
    type: 'product-updated',
    productId: updated.id,
    name: updated.name,
    sku: updated.sku,
    barcode: updated.barcode,
    price: updated.price,
    stock: updated.stock,
    minStock: updated.min_stock,
    unit: updated.unit,
    bulkUnit: updated.bulk_unit,
    bulkFactor: updated.bulk_factor,
    categoryId: updated.category_id,
    supplierId: updated.supplier_id,
    imageUrl: updated.image_url,
    costPrice: updated.cost_price,
    onPromotion: updated.on_promotion,
    promoPrice: updated.promo_price,
    active: updated.active,
  });

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'UPDATE', 'products', id, oldProduct, updated);
  }

  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);