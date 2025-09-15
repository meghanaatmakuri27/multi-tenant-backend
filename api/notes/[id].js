// pages/api/notes/[id].js
import { supabase } from '../../../lib/db.js';
import { verifyToken } from '../../../middleware/auth.js';
import { enableCors } from '../../../lib/cors.js';

export default async function handler(req, res) {
  // ✅ Handle CORS first (and stop if it's a preflight)
  if (enableCors(req, res)) return;

  // ✅ Only run auth for actual requests (not OPTIONS)
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const tenantId = user.tenant_id;
  const { id } = req.query;

  try {
    // GET single note
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .single();

      if (error) return res.status(404).json({ error: 'Note not found' });
      return res.json(data);
    }

    // PUT update note
    if (req.method === 'PUT') {
      const { title, content } = req.body;
      const { data, error } = await supabase
        .from('notes')
        .update({ title, content })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) return res.status(404).json({ error: 'Note not found or update failed' });
      return res.json(data);
    }

    // DELETE note
    if (req.method === 'DELETE') {
      const { data, error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single(); // 👈 ensures we return the deleted row

      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Note not found' });

      return res.json({ message: 'Note deleted', deleted: data });
    }

    // Method not allowed
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
