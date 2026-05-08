export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('settings.edit')) {
    throw new ValidationError('You do not have permission to edit settings');
  }
  const formData = await request.formData();
  const settings = {
    businessName: formData.get('businessName')?.toString() || '',
    whatsappNumber: formData.get('whatsappNumber')?.toString() || '',
    phoneNumber: formData.get('phoneNumber')?.toString() || '',
    locationText: formData.get('locationText')?.toString() || '',
    mapLink: formData.get('mapLink')?.toString() || '',
    openingHours: formData.get('openingHours')?.toString() || '',
    promoText: formData.get('promoText')?.toString() || '',
  };

  // Fetch old settings for audit
  const oldSettingsRows = rawDb.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const oldSettings = Object.fromEntries(oldSettingsRows.map(s => [s.key, s.value]));

  for (const [key, value] of Object.entries(settings)) {
    rawDb.prepare(`
      INSERT INTO site_settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
  }

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'UPDATE', 'site_settings', null, oldSettings, settings);
  }

  return redirect('/admin/settings');
};