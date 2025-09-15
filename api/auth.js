// api/health.js
import { enableCors } from '../lib/cors.js';

export default function handler(req, res) {
  if (enableCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({ status: 'ok' });
}
