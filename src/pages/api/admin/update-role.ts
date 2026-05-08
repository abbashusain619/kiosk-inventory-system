export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { ValidationError } from '../../../lib/errors';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('roles.manage')) {
    throw new ValidationError('Permission denied');
  }
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const name = formData.get('name')?.toString();
  const description = formData.get('description')?.toString() || null;

  if (!id || !name) throw new ValidationError('Invalid data');
  rawDb.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?').run(name, description, id);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};