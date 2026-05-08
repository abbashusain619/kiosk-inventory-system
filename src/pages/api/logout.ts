export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session')?.value;
  let userId = null;

  if (sessionId) {
    // Get user_id from session before deleting
    const session = rawDb.prepare('SELECT user_id FROM user_session WHERE id = ?').get(sessionId) as { user_id: number } | undefined;
    if (session) {
      userId = session.user_id;
      // Log logout
      await logAudit(userId, 'LOGOUT', 'admin_user', userId, null, null);
    }
    // Delete session from database (optional but good)
    rawDb.prepare('DELETE FROM user_session WHERE id = ?').run(sessionId);
  }

  cookies.delete('session', { path: '/' });
  return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
};