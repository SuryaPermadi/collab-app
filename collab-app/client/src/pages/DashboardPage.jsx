import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import api from '../lib/api.js'

export default function DashboardPage() {
  const [rooms, setRooms] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)

  const { user } = useUser()
  const { signOut } = useClerk()
  const { getToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchRooms()
  }, [user])

  async function fetchRooms() {
    try {
      const token = await getToken()
      window.__clerk_token = token
      const { data } = await api.get('/rooms')
      setRooms(data)
    } finally {
      setLoading(false)
    }
  }

  async function createRoom(e) {
    e.preventDefault()
    if (!newRoomName.trim()) return
    try {
      const { data } = await api.post('/rooms', { name: newRoomName })
      setRooms(prev => [data, ...prev])
      setNewRoomName('')
      setShowCreate(false)
      navigate(`/room/${data.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat room')
    }
  }

  async function joinRoom(e) {
    e.preventDefault()
    if (!inviteCode.trim()) return
    try {
      const { data } = await api.post('/rooms/join', { inviteCode })
      navigate(`/room/${data.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Invite code tidak valid')
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: '#00E5C3', fontSize: 24 }}>⬡</span>
          <span style={styles.logoText}>CollabSpace</span>
        </div>
        <div style={styles.userInfo}>
          <div style={{ ...styles.avatar, background: user?.avatarColor || '#00E5C3' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={() => signOut()} style={styles.logoutBtn}>Keluar</button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topRow}>
          <h1 style={styles.pageTitle}>Ruang Kolaborasi</h1>
          <div style={styles.actions}>
            <button onClick={() => setShowJoin(true)} style={styles.btnOutline}>
              + Join Room
            </button>
            <button onClick={() => setShowCreate(true)} style={styles.btnPrimary}>
              + Buat Room
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div style={styles.modal}>
            <div style={styles.modalBox}>
              <h3 style={styles.modalTitle}>Buat Room Baru</h3>
              <form onSubmit={createRoom}>
                <input
                  style={styles.input}
                  placeholder="Nama room..."
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  autoFocus
                />
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowCreate(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnPrimary}>Buat</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Modal */}
        {showJoin && (
          <div style={styles.modal}>
            <div style={styles.modalBox}>
              <h3 style={styles.modalTitle}>Join dengan Invite Code</h3>
              <form onSubmit={joinRoom}>
                <input
                  style={styles.input}
                  placeholder="Contoh: AB12CD34"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  autoFocus
                />
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowJoin(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnPrimary}>Join</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Room Grid */}
        {loading ? (
          <div style={styles.empty}>Memuat...</div>
        ) : rooms.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
            <p>Belum ada room. Buat room baru untuk mulai berkolaborasi!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {rooms.map(room => (
              <div
                key={room.id}
                style={styles.card}
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardIcon}>⬡</div>
                  <span style={styles.roleTag}>{room.role}</span>
                </div>
                <h3 style={styles.cardTitle}>{room.name}</h3>
                <div style={styles.cardMeta}>
                  <span>{room.member_count} member</span>
                  <span style={styles.inviteCode}>#{room.invite_code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 48px', borderBottom: '1px solid #1E2433',
    position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoText: { fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: 'var(--bg)',
  },
  userName: { fontSize: 14, color: 'var(--text)' },
  logoutBtn: {
    background: 'none', border: '1px solid #1E2433', color: 'var(--textMuted)',
    padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  },
  main: { padding: '48px', maxWidth: 1100, margin: '0 auto' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: 'var(--text)' },
  actions: { display: 'flex', gap: 12 },
  btnPrimary: {
    background: '#00E5C3', color: 'var(--bg)', border: 'none',
    padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
  },
  btnOutline: {
    background: 'none', color: 'var(--text)', border: '1px solid #1E2433',
    padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  },
  btnCancel: {
    background: 'none', color: 'var(--textMuted)', border: '1px solid #1E2433',
    padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: {
    background: 'var(--bgPanel)', border: '1px solid #1E2433',
    padding: '28px', cursor: 'pointer', transition: 'border-color 0.2s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardIcon: { fontSize: 24, color: '#00E5C3' },
  roleTag: {
    fontSize: 10, fontFamily: 'monospace', color: 'var(--textMuted)',
    background: 'var(--border)', padding: '3px 8px', letterSpacing: '0.1em',
  },
  cardTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 },
  cardMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--textMuted)' },
  inviteCode: { fontFamily: 'monospace', color: '#00E5C3' },
  empty: { textAlign: 'center', color: 'var(--textMuted)', padding: '100px 0', fontSize: 15, lineHeight: 1.8 },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modalBox: { background: 'var(--bgPanel)', border: '1px solid #1E2433', padding: 40, width: 380 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },
  input: {
    width: '100%', background: 'var(--bg)', border: '1px solid #1E2433',
    color: 'var(--text)', padding: '12px 14px', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16,
  },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
}