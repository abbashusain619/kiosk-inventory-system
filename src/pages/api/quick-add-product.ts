export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { db } from '../../db';
import { categories } from '../../db/schema';
import { eq } from 'drizzle-orm';

const postHandler: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const price = parseFloat(formData.get('price') as string);
  const unit = formData.get('unit')?.toString() || 'piece';
  const categoryName = formData.get('category')?.toString();

  if (!name || isNaN(price)) {
    throw new ValidationError('Name and price required');
  }

  // Find or create category
  let categoryId = null;
  if (categoryName) {
    const existing = await db.select().from(categories).where(eq(categories.name, categoryName)).get();
    if (!existing) {
      const [newCat] = await db.insert(categories).values({ name: categoryName }).returning();
      categoryId = newCat.id;
    } else {
      categoryId = existing.id;
    }
  }

  // Prepare product data (all fields required by ProductSchema)
  const productData = {
    name,
    price,
    unit,
    category_id: categoryId,
    stock: 0,
    active: true,
    on_promotion: false,
    promo_price: null,
    cost_price: null,
    image_url: null,
    supplier_id: null,
  };

  const newProduct = await save('products', productData);
  broadcastEvent({ type: 'product-created', product: newProduct });
  return new Response(JSON.stringify({ id: newProduct.id, name: newProduct.name }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST = createApiHandler(postHandler);