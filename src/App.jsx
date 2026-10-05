import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { Trophy, Users, Edit2, Play, Settings, Plus, ArrowLeft, Share2, Save } from 'lucide-react';
import { db } from './lib/db';
import './App.css';

const getNextPowerOf2 = (n) => Math.pow(2, Math.ceil(Math.log2(n)));
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- COMPONENT: LOGIN OVERLAY ---
const LoginOverlay = ({ onLogin, onCancel }) => {
  const [passwordInput, setPasswordInput] = useState('');
  
  const handleLogin = () => {
    if (passwordInput === 'admin123') {
      onLogin();
    } else {
      alert('Password salah!');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ margin: 0, textAlign: 'center', color: 'var(--accent-primary)' }}>Login Akses Admin</h3>
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Masukkan password untuk mengakses admin</p>
        <input 
          type="password" 
          className="input-field" 
          placeholder="Password..."
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          {onCancel && <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Batal</button>}
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: ADMIN DASHBOARD ---
const Dashboard = ({ isAuthenticated, setIsAuthenticated }) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadTournaments();
    }
  }, [isAuthenticated]);

  const loadTournaments = async () => {
    setLoading(true);
    const data = await db.getTournaments();
    setTournaments(data || []);
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '500px' }}>
          <Trophy size={80} color="var(--accent-primary)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Bracket Master</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Login sebagai Admin untuk membuat dan mengatur turnamen.</p>
          <LoginOverlay onLogin={() => setIsAuthenticated(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Dashboard Admin</h1>
        <p>Kelola semua turnamen Anda</p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Daftar Turnamen</h2>
        <button className="btn-primary" onClick={() => navigate('/setup')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Buat Turnamen Baru
        </button>
      </div>

      {loading ? (
        <p>Memuat turnamen...</p>
      ) : tournaments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Belum ada turnamen yang dibuat.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {tournaments.map(t => (
            <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt="logo" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <Trophy size={30} color="var(--accent-primary)" />
                )}
                <h3 style={{ margin: 0 }}>{t.name}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{t.description || 'Tanpa deskripsi'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => navigate(`/admin/${t.id}`)}>Edit</button>
                <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => navigate(`/t/${t.id}`)}>Lihat Publik</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: SETUP TOURNAMENT ---
const SetupTournament = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [tournamentInfo, setTournamentInfo] = useState({
    name: 'Turnamen Baru',
    description: '',
    participantsCount: 8,
    logoUrl: '',
  });

  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTournamentInfo(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    const size = parseInt(tournamentInfo.participantsCount) || 8;
    const powerSize = getNextPowerOf2(size);
    const numRounds = Math.log2(powerSize);
    
    let bracket = [];
    for (let r = 0; r < numRounds; r++) {
      let numMatches = Math.pow(2, numRounds - 1 - r);
      let roundMatches = [];
      for (let m = 0; m < numMatches; m++) {
        roundMatches.push({
          id: `r${r}-m${m}`,
          p1: { name: r === 0 ? `Team ${(m * 2) + 1}` : '', score: '' },
          p2: { name: r === 0 ? `Team ${(m * 2) + 2}` : '', score: '' },
          winner: null // 'p1' or 'p2'
        });
      }
      bracket.push(roundMatches);
    }

    const newTournament = {
      id: generateId(),
      ...tournamentInfo,
      bracket
    };

    await db.saveTournament(newTournament);
    navigate(`/admin/${newTournament.id}`);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Buat Turnamen Baru</h1>
        <p>Konfigurasikan detail braket Anda</p>
      </div>
      
      <div className="glass-panel setup-container">
        <div className="form-group">
          <label className="input-label">Nama Turnamen</label>
          <input 
            type="text" 
            className="input-field" 
            value={tournamentInfo.name} 
            onChange={(e) => setTournamentInfo({...tournamentInfo, name: e.target.value})} 
          />
        </div>

        <div className="form-group">
          <label className="input-label">Logo Acara (Upload Gambar)</label>
          <input 
            type="file" 
            accept="image/*"
            className="input-field" 
            onChange={handleImageUpload}
            style={{ padding: '0.5rem' }}
          />
          {tournamentInfo.logoUrl && (
            <img src={tournamentInfo.logoUrl} alt="Preview" style={{ marginTop: '0.5rem', width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
          )}
        </div>
        
        <div className="form-group">
          <label className="input-label">Keterangan</label>
          <input 
            type="text" 
            className="input-field" 
            value={tournamentInfo.description} 
            onChange={(e) => setTournamentInfo({...tournamentInfo, description: e.target.value})} 
          />
        </div>
        
        <div className="form-group">
          <label className="input-label">Jumlah Peserta (Otomatis ke kelipatan 2 terdekat)</label>
          <input 
            type="number" 
            className="input-field" 
            value={tournamentInfo.participantsCount} 
            onChange={(e) => setTournamentInfo({...tournamentInfo, participantsCount: e.target.value})} 
            min="2" max="128"
          />
        </div>
        
        <button className="btn-primary" onClick={handleCreate} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Play size={18} />
          Buat Bagan & Simpan
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT: TOURNAMENT VIEW (ADMIN & PUBLIC) ---
const TournamentView = ({ isAdminView }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInfo, setEditInfo] = useState(null);
  
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [participantList, setParticipantList] = useState('');

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = async () => {
    setLoading(true);
    const data = await db.getTournament(id);
    if (data) {
      setTournament(data);
    }
    setLoading(false);
  };

  const handleSave = async (updatedBracket) => {
    setSaving(true);
    const updated = { ...tournament, bracket: updatedBracket };
    setTournament(updated);
    await db.saveTournament(updated);
    setSaving(false);
  };

  const openEditModal = () => {
    setEditInfo({
      name: tournament.name,
      description: tournament.description,
      participantsCount: tournament.participantsCount || Math.pow(2, tournament.bracket.length),
      logoUrl: tournament.logoUrl || ''
    });
    setShowEditModal(true);
  };

  const handleImageUploadEdit = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditInfo(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    const size = parseInt(editInfo.participantsCount) || 8;
    const powerSize = getNextPowerOf2(size);
    const numRounds = Math.log2(powerSize);
    
    let newBracket = tournament.bracket;

    if (numRounds !== tournament.bracket.length) {
      const confirmReset = window.confirm("PERHATIAN: Anda mengubah jumlah peserta. Ini akan me-reset dan menghapus seluruh bagan beserta nama tim yang sudah berjalan. Lanjutkan?");
      if (!confirmReset) return;

      newBracket = [];
      for (let r = 0; r < numRounds; r++) {
        let numMatches = Math.pow(2, numRounds - 1 - r);
        let roundMatches = [];
        for (let m = 0; m < numMatches; m++) {
          roundMatches.push({
            id: `r${r}-m${m}`,
            p1: { name: r === 0 ? `Team ${(m * 2) + 1}` : '', score: '' },
            p2: { name: r === 0 ? `Team ${(m * 2) + 2}` : '', score: '' },
            winner: null
          });
        }
        newBracket.push(roundMatches);
      }
    }

    const updated = {
      ...tournament,
      name: editInfo.name,
      description: editInfo.description,
      logoUrl: editInfo.logoUrl,
      participantsCount: editInfo.participantsCount,
      bracket: newBracket
    };

    setSaving(true);
    await db.saveTournament(updated);
    setTournament(updated);
    setSaving(false);
    setShowEditModal(false);
  };

  const handleDrawParticipants = () => {
    const names = participantList.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length === 0) {
      alert("Masukkan setidaknya 1 nama peserta!");
      return;
    }

    // Acak array (Fisher-Yates shuffle)
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    let newBracket = [...tournament.bracket];
    
    // Isi ronde pertama dengan peserta yang sudah diacak
    let nameIndex = 0;
    for (let m = 0; m < newBracket[0].length; m++) {
      newBracket[0][m].p1.name = names[nameIndex++] || '';
      newBracket[0][m].p2.name = names[nameIndex++] || '';
      newBracket[0][m].p1.score = '';
      newBracket[0][m].p2.score = '';
      newBracket[0][m].winner = null;
    }

    // Hapus sisa bagan ronde-ronde selanjutnya agar bersih
    for (let r = 1; r < newBracket.length; r++) {
      for (let m = 0; m < newBracket[r].length; m++) {
        newBracket[r][m].p1 = { name: '', score: '' };
        newBracket[r][m].p2 = { name: '', score: '' };
        newBracket[r][m].winner = null;
      }
    }

    handleSave(newBracket);
    setShowDrawModal(false);
    setParticipantList('');
    alert('Undian berhasil! Nama-nama tim telah dimasukkan secara acak ke dalam bagan.');
  };

  const updateMatch = (rIndex, mIndex, playerKey, field, value) => {
    if (!isAdminView) return;
    const newBracket = [...tournament.bracket];
    newBracket[rIndex][mIndex][playerKey][field] = value;
    handleSave(newBracket);
  };

  const advanceWinner = (rIndex, mIndex, winnerKey) => {
    if (!isAdminView) return;
    const newBracket = [...tournament.bracket];
    const match = newBracket[rIndex][mIndex];
    match.winner = winnerKey;
    
    // Advance to next round if not the last round
    if (rIndex < newBracket.length - 1) {
      const nextRoundIndex = rIndex + 1;
      const nextMatchIndex = Math.floor(mIndex / 2);
      const isPlayer1InNextMatch = mIndex % 2 === 0;
      const nextPlayerKey = isPlayer1InNextMatch ? 'p1' : 'p2';
      newBracket[nextRoundIndex][nextMatchIndex][nextPlayerKey].name = match[winnerKey].name;
    }
    
    handleSave(newBracket);
  };

  if (loading) return <div className="app-container" style={{ textAlign: 'center', marginTop: '5rem' }}>Memuat data turnamen...</div>;
  if (!tournament) return <div className="app-container" style={{ textAlign: 'center', marginTop: '5rem' }}>Turnamen tidak ditemukan!</div>;

  const bracket = tournament.bracket;
  const publicLink = `${window.location.origin}/t/${id}`;

  return (
    <div className="app-container" style={{ maxWidth: '100%' }}>
      <div className="controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAdminView && (
            <button className="btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem', border: 'none' }} title="Kembali ke Dashboard">
              <ArrowLeft size={24} />
            </button>
          )}
          {tournament.logoUrl ? (
            <img src={tournament.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--accent-primary)' }} />
          ) : (
            <Trophy size={40} color="var(--accent-primary)" />
          )}
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              {tournament.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{tournament.description}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {saving && <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Menyimpan...</span>}
          {isAdminView && (
            <>
              <button className="btn-primary" onClick={() => setShowDrawModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Undian Tim
              </button>
              <button className="btn-secondary" onClick={openEditModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} /> Edit Turnamen
              </button>
              <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(publicLink); alert('Link publik berhasil disalin!'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={18} /> Salin Link Publik
              </button>
            </>
          )}
          {!isAdminView && (
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              Mode Publik (Hanya Lihat)
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel bracket-wrapper">
        <div className="bracket-container">
          {bracket.map((round, rIndex) => (
            <div key={`round-${rIndex}`} className="round">
              {round.map((match, mIndex) => (
                <div key={match.id} className="match-container" style={{ margin: `${Math.pow(2, rIndex) - 1}rem 0` }}>
                  <div className="match">
                    {/* Player 1 */}
                    <div 
                      className={`team ${match.winner === 'p1' ? 'winner' : ''}`}
                      onDoubleClick={() => advanceWinner(rIndex, mIndex, 'p1')}
                      title={isAdminView ? "Klik dua kali untuk memajukan" : ""}
                      style={{ cursor: isAdminView ? 'pointer' : 'default' }}
                    >
                      <input 
                        type="text" 
                        className="team-input"
                        value={match.p1.name}
                        onChange={(e) => updateMatch(rIndex, mIndex, 'p1', 'name', e.target.value)}
                        placeholder={isAdminView ? "TBD" : ""}
                        readOnly={!isAdminView}
                        style={{ cursor: isAdminView ? 'text' : 'default' }}
                      />
                      <input 
                        type="text"
                        className="team-input team-score"
                        style={{ width: '30px', textAlign: 'center', marginLeft: '0.5rem', cursor: isAdminView ? 'text' : 'default', opacity: (!isAdminView && !match.p1.score) ? 0 : 1 }}
                        value={match.p1.score}
                        onChange={(e) => updateMatch(rIndex, mIndex, 'p1', 'score', e.target.value)}
                        placeholder="-"
                        readOnly={!isAdminView}
                      />
                    </div>
                    
                    {/* Player 2 */}
                    <div 
                      className={`team ${match.winner === 'p2' ? 'winner' : ''}`}
                      onDoubleClick={() => advanceWinner(rIndex, mIndex, 'p2')}
                      title={isAdminView ? "Klik dua kali untuk memajukan" : ""}
                      style={{ cursor: isAdminView ? 'pointer' : 'default' }}
                    >
                      <input 
                        type="text" 
                        className="team-input"
                        value={match.p2.name}
                        onChange={(e) => updateMatch(rIndex, mIndex, 'p2', 'name', e.target.value)}
                        placeholder={isAdminView ? "TBD" : ""}
                        readOnly={!isAdminView}
                        style={{ cursor: isAdminView ? 'text' : 'default' }}
                      />
                      <input 
                        type="text"
                        className="team-input team-score"
                        style={{ width: '30px', textAlign: 'center', marginLeft: '0.5rem', cursor: isAdminView ? 'text' : 'default', opacity: (!isAdminView && !match.p2.score) ? 0 : 1 }}
                        value={match.p2.score}
                        onChange={(e) => updateMatch(rIndex, mIndex, 'p2', 'score', e.target.value)}
                        placeholder="-"
                        readOnly={!isAdminView}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {/* Champion Slot */}
          {bracket.length > 0 && (
            <div className="round champion-round" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-4rem', top: '50%', width: '4rem', height: '2px', background: 'var(--border-glass)' }}></div>
              <Trophy size={80} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.6))', marginBottom: '1rem' }} />
              <div className="match" style={{ borderColor: '#f59e0b', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
                <div style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#f59e0b' }}>
                  {bracket[bracket.length - 1][0].winner 
                    ? bracket[bracket.length - 1][0][bracket[bracket.length - 1][0].winner].name || 'Champion'
                    : 'TBD'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {isAdminView && (
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          <p>Tip Admin: Setiap perubahan otomatis tersimpan. Klik dua kali pada tim untuk memajukannya.</p>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-primary)', marginBottom: '1rem' }}>Edit Pengaturan Turnamen</h3>
            
            <div className="form-group">
              <label className="input-label">Nama Turnamen</label>
              <input type="text" className="input-field" value={editInfo.name} onChange={(e) => setEditInfo({...editInfo, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="input-label">Logo Acara (Opsional)</label>
              <input type="file" accept="image/*" className="input-field" onChange={handleImageUploadEdit} style={{ padding: '0.5rem' }} />
              {editInfo.logoUrl && (
                <img src={editInfo.logoUrl} alt="Preview" style={{ marginTop: '0.5rem', width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
              )}
            </div>

            <div className="form-group">
              <label className="input-label">Keterangan</label>
              <input type="text" className="input-field" value={editInfo.description} onChange={(e) => setEditInfo({...editInfo, description: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="input-label">Jumlah Peserta (Peringatan: Mengubah ini akan mereset bagan!)</label>
              <input type="number" className="input-field" value={editInfo.participantsCount} onChange={(e) => setEditInfo({...editInfo, participantsCount: e.target.value})} min="2" max="128" />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Batal</button>
              <button className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={handleSaveEdit}>
                <Save size={18} /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAW (UNDIAN) MODAL */}
      {showDrawModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Undian Peserta Otomatis</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, marginBottom: '1rem' }}>
              Masukkan daftar nama tim/peserta ke dalam kotak di bawah ini (pisahkan dengan Enter). 
              Sistem akan mengacak urutan dan memasukkannya otomatis ke dalam bagan pertandingan babak pertama.
            </p>
            
            <div className="form-group">
              <textarea 
                className="input-field" 
                rows="10" 
                value={participantList} 
                onChange={(e) => setParticipantList(e.target.value)} 
                placeholder="EVOS Glory&#10;RRQ Hoshi&#10;ONIC Esports&#10;BTR Alpha&#10;..."
                style={{ resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'right' }}>
                Total: {participantList.split('\n').filter(n => n.trim()).length} Tim
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDrawModal(false)}>Batal</button>
              <button className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={handleDrawParticipants}>
                <Users size={18} /> Acak & Masukkan Bagan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- APP ENTRY POINT ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/setup" element={<SetupTournament isAuthenticated={isAuthenticated} />} />
        <Route path="/admin/:id" element={isAuthenticated ? <TournamentView isAdminView={true} /> : <Dashboard isAuthenticated={false} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/t/:id" element={<TournamentView isAdminView={false} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
