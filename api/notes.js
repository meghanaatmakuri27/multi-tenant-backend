// pages/api/notes.js
import { supabase } from '../../lib/db.js';
import { verifyToken } from '../../middleware/auth.js';
import { enableCors } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (enableCors(req, res)) return;

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = user.tenant_id;

  try {
    // GET all notes
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return res.json(data);
    }

    // POST create note
    if (req.method === 'POST') {
      const { title, content } = req.body;

      // Check Free plan limit
      const { data: tenant } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', tenantId)
        .single();

      if (tenant.plan === 'Free') {
        const { count } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);

        if (count >= 3) {
          return res
            .status(403)
            .json({ error: 'Free plan limit reached. Upgrade to Pro.' });
        }
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([{ title, content, tenant_id: tenantId }])
        .select()
        .single(); // 👈 ensure we get the created row

      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
