import { rawDb } from '../db';

export async function logAudit(
  userId: number,
  action: string,
  tableName: string,
  recordId: number | null,
  oldData: any = null,
  newData: any = null
) {
  const stmt = rawDb.prepare(`
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    userId,
    action,
    tableName,
    recordId,
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    Date.now()
  );
}