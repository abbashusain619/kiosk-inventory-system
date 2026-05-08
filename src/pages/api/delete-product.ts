export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { deleteRecord } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('products.edit')) {
    throw new ValidationError('You do not have permission to delete products');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  await deleteRecord('products', id);
  broadcastEvent({ type: 'product-deleted', productId: id });
  return redirect('/admin/products');
};

export const POST = createApiHandler(postHandler);