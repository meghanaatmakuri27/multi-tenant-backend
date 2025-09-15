// api/tenants/[slug]/upgrade.js
import { supabase } from '../../../lib/db.js';
import { verifyToken } from '../../../middleware/auth.js';
import { enableCors } from '../../../lib/cors.js';

export default async function handler(req, res) {
  if (enableCors(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

  const { slug } = req.query;

  const { data: tenant, error } = await supabase
    .from('tenants')
    .update({ plan: 'Pro' })
    .eq('name', slug)
    .single();

  if (error) return res.status(404).json({ error: 'Tenant not found or upgrade failed' });
  return res.json({ message: `${slug} upgraded to Pro` });
}
