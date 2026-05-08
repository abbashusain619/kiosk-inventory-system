export const prerender = false;
import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';
import path from 'path';
import { UnauthorizedError, ValidationError } from '../../lib/errors';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.permissions?.includes('backup.download')) {
    throw new ValidationError('Permission denied');
  }

  const dbPath = path.join(process.cwd(), 'data', 'kiosk.db');
  const file = readFileSync(dbPath);
  return new Response(file, {
    headers: {
      'Content-Type': 'application/x-sqlite3',
      'Content-Disposition': `attachment; filename="kiosk-backup-${new Date().toISOString().slice(0,19)}.db"`,
    },
  });
};