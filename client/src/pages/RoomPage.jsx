import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket.js'
import { useRoomStore } from '../stores/index.js'
import { useAuthStore } from '../stores/index.js'
import api from '../lib/api.js'
import PresenceBar from '../components/shared/PresenceBar.jsx'
import CollabEditor from '../components/editor/CollabEditor.jsx'
import CollabCanvas from '../components/canvas/CollabCanvas.jsx'
import KanbanBoard from '../components/kanban/KanbanBoard.jsx'

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  const { joinRoom } = useSocket()
  const { activeTab, setActiveTab } = useRoomStore()
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    async function init() {
      try {
        const { data } = await api.get(`/rooms/${roomId}`)
        setRoom(data)
        joinRoom(roomId)
      } catch {
        alert('Room tidak ditemukan')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [roomId])

  if (loading) {
    return (
      <div style={styles.loading}>
        <span style={{ color: '#00E5C3' }}>⬡</span> Memuat ruang kolaborasi...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <header style={styles.header}>
        <div style={styles.left}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>← Dashboard</button>
          <div style={styles.divider} />
          <span style={styles.roomName}>{room?.name}</span>
          <div style={styles.inviteBadge}>
            <span style={styles.inviteLabel}>Invite:</span>
            <span style={styles.inviteCode}>{room?.invite_code}</span>
            <button
              style={styles.copyBtn}
              onClick={() => {
                navigator.clipboard.writeText(room?.invite_code)
                alert('Invite code disalin!')
              }}
            >
              Salin
            </button>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'board' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('board')}
          >
            🗂 Board
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'editor' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('editor')}
          >
            📝 Dokumen
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'canvas' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('canvas')}
          >
            🎨 Whiteboard
          </button>
        </div>

        <PresenceBar />
      </header>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'board' && <KanbanBoard roomId={roomId} />}
        {activeTab === 'editor' && <CollabEditor roomId={roomId} />}
        {activeTab === 'canvas' && <CollabCanvas roomId={roomId} />}
      </div>
    </div>
  )
}

const styles = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#080A0F', fontFamily: "'DM Sans', sans-serif" },
  loading: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#5A6380', fontFamily: 'monospace', gap: 10, background: '#080A0F',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 0,
    padding: '0 24px', borderBottom: '1px solid #1E2433',
    height: 56, flexShrink: 0, justifyContent: 'space-between',
    background: '#0D1017',
  },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  backBtn: {
    background: 'none', border: 'none', color: '#5A6380',
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '4px 0',
  },
  divider: { width: 1, height: 20, background: '#1E2433' },
  roomName: { fontSize: 15, fontWeight: 600, color: '#E8EBF2' },
  inviteBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#0F1420', border: '1px solid #1E2433',
    padding: '4px 10px', fontSize: 12,
  },
  inviteLabel: { color: '#5A6380' },
  inviteCode: { fontFamily: 'monospace', color: '#00E5C3', fontWeight: 700 },
  copyBtn: {
    background: 'none', border: 'none', color: '#5A6380',
    cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', padding: 0,
  },
  tabs: { display: 'flex', gap: 4 },
  tab: {
    background: 'none', border: 'none', color: '#5A6380',
    padding: '8px 16px', cursor: 'pointer', fontSize: 13,
    fontFamily: 'inherit', borderBottom: '2px solid transparent',
    transition: 'color 0.2s',
  },
  tabActive: { color: '#00E5C3', borderBottom: '2px solid #00E5C3' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}