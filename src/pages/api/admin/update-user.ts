export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { ValidationError } from '../../../lib/errors';
import bcrypt from 'bcryptjs';
import { logAudit } from '../../../lib/audit';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('users.manage')) {
    throw new ValidationError('You do not have permission to manage users');
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const roleId = formData.get('roleId') ? Number(formData.get('roleId')) : undefined;
  const newPassword = formData.get('newPassword')?.toString();

  if (isNaN(id)) throw new ValidationError('Invalid user ID');

  // Fetch old user data before update (exclude password hash)
  const oldUser = rawDb.prepare('SELECT id, email, role_id FROM admin_user WHERE id = ?').get(id) as any;
  if (!oldUser) throw new ValidationError('User not found');

  const updates: string[] = [];
  const values: any[] = [];

  if (roleId !== undefined) {
    updates.push('role_id = ?');
    values.push(roleId);
  }
  if (newPassword) {
    const hashed = bcrypt.hashSync(newPassword, 10);
    updates.push('hashed_password = ?');
    values.push(hashed);
  }

  if (updates.length === 0) {
    throw new ValidationError('No changes provided');
  }

  values.push(id);
  const stmt = rawDb.prepare(`UPDATE admin_user SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  // Audit log
  if (locals.user?.id) {
    const newUser = { id, email: oldUser.email, role_id: roleId !== undefined ? roleId : oldUser.role_id };
    await logAudit(locals.user.id, 'UPDATE', 'admin_user', id, oldUser, newUser);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};