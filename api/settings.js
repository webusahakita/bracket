import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default async function handler(req, res) {
  if (!redis.url || !redis.token) {
    return res.status(500).json({ error: 'Database belum dikonfigurasi.' });
  }

  if (req.method === 'GET') {
    try {
      const password = await redis.get('admin_password');
      return res.status(200).json({ password: password || 'admin123' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ error: 'Password baru wajib disertakan.' });
      }
      
      await redis.set('admin_password', newPassword);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
