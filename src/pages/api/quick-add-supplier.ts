export const prerender = false;
import type { APIRoute } from 'astro';
import { createApiHandler } from '../../lib/api-utils';
import { save } from '../../services/db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

const postHandler: APIRoute = async ({ request, locals }) => {
    if (!locals.permissions?.includes('suppliers.edit')) {
    throw new ValidationError('You do not have permission to add suppliers');
  }
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;

  if (!name) {
    throw new ValidationError('Supplier name required');
  }

  const supplierData = {
    name,
    phone,
  };

  const newSupplier = await save('suppliers', supplierData);
  broadcastEvent({ type: 'supplier-created', supplier: newSupplier });

  return new Response(JSON.stringify({ id: newSupplier.id, name: newSupplier.name }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST = createApiHandler(postHandler);