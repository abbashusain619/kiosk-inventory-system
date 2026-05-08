export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { ValidationError } from '../../../lib/errors';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('roles.manage')) {
    throw new ValidationError('Permission denied');
  }
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const description = formData.get('description')?.toString() || null;
  if (!name) throw new ValidationError('Role name required');

  const stmt = rawDb.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
  const info = stmt.run(name, description);
  return new Response(JSON.stringify({ id: info.lastInsertRowid, name, description }), {
    headers: { 'Content-Type': 'application/json' },
  });
};