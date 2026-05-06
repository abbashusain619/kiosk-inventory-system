export const prerender = false;
import type { APIRoute } from 'astro';
import { db } from '../../db';
import { products } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent } from '../../lib/sse';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  
  // Soft delete: set active to false
  await db.update(products).set({ active: false }).where(eq(products.id, id));
  
  broadcastEvent({ type: 'product-deleted', productId: id });
  
  return redirect('/admin/products');
};