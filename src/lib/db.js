// Mock DB LocalStorage (sebagai fallback jika belum di-deploy ke Vercel atau belum ada DB)
const getLocalDB = () => {
  const data = localStorage.getItem('tournaments_db');
  return data ? JSON.parse(data) : [];
};

const saveLocalDB = (data) => {
  localStorage.setItem('tournaments_db', JSON.stringify(data));
};

// Cek apakah kita sedang berjalan di environment yang memiliki akses ke API (Vercel)
// Saat development lokal (Vite), request ke /api mungkin gagal kecuali disetup proxy,
// jadi kita akan menangani fallback dengan mulus.
export const db = {
  async getTournaments() {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // API error (misal sedang offline atau lokal tanpa vercel CLI)
    }
    console.warn("Menggunakan LocalStorage (Database Vercel belum tersedia/lokal)");
    return getLocalDB();
  },

  async getTournament(id) {
    try {
      const res = await fetch(`/api/tournaments?id=${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return getLocalDB().find(t => t.id === id);
  },

  async saveTournament(tournament) {
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournament),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    
    // Simpan ke lokal jika API gagal
    const local = getLocalDB();
    const existingIndex = local.findIndex(t => t.id === tournament.id);
    if (existingIndex >= 0) {
      local[existingIndex] = tournament;
    } else {
      local.push(tournament);
    }
    saveLocalDB(local);
    return tournament;
  },

  async deleteTournament(id) {
    // Untuk pengembangan lebih lanjut jika diperlukan fitur hapus
    const local = getLocalDB();
    saveLocalDB(local.filter(t => t.id !== id));
    return true;
  },

  async getPassword() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        return data.password;
      }
    } catch (e) {
      // Fallback
    }
    return localStorage.getItem('admin_password') || 'admin123';
  },

  async updatePassword(newPassword) {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) return true;
    } catch (e) {
      // Fallback
    }
    localStorage.setItem('admin_password', newPassword);
    return true;
  }
};
