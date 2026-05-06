export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const POST: APIRoute = async ({ request, redirect }) => {
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

  for (const [key, value] of Object.entries(settings)) {
    rawDb.prepare(`
      INSERT INTO site_settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
  }

  return redirect('/admin/settings');
};