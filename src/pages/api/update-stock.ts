export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save, findById } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) return redirect('/admin/login');

  if (!locals.permissions?.includes('products.edit')) {
    throw new ValidationError('You do not have permission to edit products');
  }

  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const newStock = Number(formData.get('stock'));

  if (isNaN(productId) || isNaN(newStock)) {
    throw new ValidationError('Invalid product ID or stock value');
  }

  const product = await findById('products', productId);
  if (!product) throw new ValidationError('Product not found');

  // Update only the stock field using save() with id
  await save('products', { id: productId, stock: newStock });

  broadcastEvent({ type: 'stock-update', productId, stock: newStock });

  return redirect('/admin/dashboard');
};

export const POST = createApiHandler(postHandler);