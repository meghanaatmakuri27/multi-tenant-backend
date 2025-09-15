// api/notes.js
import { supabase } from '../lib/db.js';
import { verifyToken } from '../middleware/auth.js';
import { enableCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (enableCors(req, res)) return;

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = user.tenant_id;
  const { id } = req.query;

  // GET all notes
  if (req.method === 'GET' && !id) {
    const { data, error } = await supabase.from('notes').select('*').eq('tenant_id', tenantId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // GET single note
  if (req.method === 'GET' && id) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Note not found' });
    return res.json(data);
  }

  // POST create note
  if (req.method === 'POST') {
    const { title, content } = req.body;

    // Check Free plan limit
    const { data: tenant } = await supabase.from('tenants').select('plan').eq('id', tenantId).single();

    if (tenant.plan === 'Free') {
      const { count } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (count >= 3) {
        return res.status(403).json({ error: 'Free plan limit reached. Upgrade to Pro.' });
      }
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, content, tenant_id: tenantId }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  // PUT update note
  if (req.method === 'PUT' && id) {
    const { title, content } = req.body;
    const { data, error } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error || !data) return res.status(404).json({ error: 'Note not found or update failed' });
    return res.json(data[0]);
  }

  // DELETE note
  if (req.method === 'DELETE' && id) {
    const { data, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error || !data) return res.status(404).json({ error: 'Note not found or delete failed' });
    return res.json({ message: 'Note deleted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
