import { Redis } from '@upstash/redis';

// Konfigurasi Database Redis (Otomatis dari Vercel Upstash)
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default async function handler(req, res) {
  // Jika database belum di-setup di Vercel, kita akan kasih peringatan
  if (!redis.url || !redis.token) {
    return res.status(500).json({ 
      error: 'Database belum dikonfigurasi. Silakan install Upstash Redis di Vercel Integrations.' 
    });
  }

  // Menangani GET request (mengambil data turnamen)
  if (req.method === 'GET') {
    const { id } = req.query;
    
    try {
      if (id) {
        // Ambil 1 turnamen spesifik
        const data = await redis.get(`tournament:${id}`);
        if (!data) return res.status(404).json({ error: 'Turnamen tidak ditemukan' });
        return res.status(200).json(data);
      } else {
        // Ambil semua turnamen
        const keys = await redis.keys('tournament:*');
        if (keys.length === 0) return res.status(200).json([]);
        
        const tournaments = await redis.mget(...keys);
        return res.status(200).json(tournaments.filter(Boolean));
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Menangani POST request (menyimpan / mengupdate data turnamen)
  if (req.method === 'POST') {
    try {
      const tournament = req.body;
      if (!tournament.id) {
        return res.status(400).json({ error: 'ID turnamen wajib disertakan.' });
      }
      
      // Simpan ke Redis (Upstash)
      await redis.set(`tournament:${tournament.id}`, tournament);
      
      return res.status(200).json(tournament);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
