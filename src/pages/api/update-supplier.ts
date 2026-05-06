export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const email = formData.get('email')?.toString() || null;
  const address = formData.get('address')?.toString() || null;

  if (!id || !name) {
    throw new ValidationError('Invalid data');
  }

  const supplierData = { id, name, phone, email, address };
  await save('suppliers', supplierData);

  broadcastEvent({ type: 'supplier-updated', supplierId: id });

  return redirect('/admin/suppliers?updated=1');
};

export const POST = createApiHandler(postHandler);