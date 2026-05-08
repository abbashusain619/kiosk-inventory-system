export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { deleteRecord } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { findById } from '../../services/db';

const postHandler: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('products.edit')) {
    throw new ValidationError('You do not have permission to delete products');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  
  // Fetch product before deletion for audit
  const product = await findById('products', id);
  if (!product) throw new ValidationError('Product not found');

  await deleteRecord('products', id);
  broadcastEvent({ type: 'product-deleted', productId: id });

  if (locals.user?.id) {
    await logAudit(locals.user.id, 'DELETE', 'products', id, product, null);
  }

  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);