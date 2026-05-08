export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { ValidationError, UnauthorizedError } from '../../../lib/errors';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.permissions?.includes('users.manage')) {
    throw new ValidationError('You do not have permission to manage users');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));

  if (isNaN(id)) throw new ValidationError('Invalid user ID');

  // Prevent deleting yourself
  const sessionId = cookies.get('session')?.value;
  const currentUser = rawDb.prepare('SELECT user_id FROM user_session WHERE id = ?').get(sessionId) as { user_id: number } | undefined;
  if (currentUser && currentUser.user_id === id) {
    throw new ValidationError('You cannot delete your own account');
  }

  const stmt = rawDb.prepare('DELETE FROM admin_user WHERE id = ?');
  stmt.run(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};