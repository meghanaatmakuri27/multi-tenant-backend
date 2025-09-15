// api/auth.js
import { supabase } from '../lib/db.js';
import jwt from 'jsonwebtoken';
import { enableCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (enableCors(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.status(200).json({ token });
}
