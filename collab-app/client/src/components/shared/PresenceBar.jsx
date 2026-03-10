import { useRoomStore } from '../../stores/index.js'
import { useAuthStore } from '../../stores/index.js'

export default function PresenceBar() {
  const onlineUsers = useRoomStore(s => s.onlineUsers)
  const currentUser = useAuthStore(s => s.user)

  // Batasi tampilan max 5 avatar, sisanya "+N"
  const MAX_VISIBLE = 5
  const visible = onlineUsers.slice(0, MAX_VISIBLE)
  const extra = onlineUsers.length - MAX_VISIBLE

  return (
    <div style={styles.wrap}>
      <div style={styles.statusDot} />
      <span style={styles.count}>{onlineUsers.length} online</span>

      <div style={styles.avatars}>
        {visible.map((user, i) => (
          <div
            key={user.id}
            title={user.name + (user.id === currentUser?.id ? ' (kamu)' : '')}
            style={{
              ...styles.avatar,
              background: user.avatarColor,
              marginLeft: i === 0 ? 0 : -8,
              zIndex: MAX_VISIBLE - i,
              border: user.id === currentUser?.id ? '2px solid #E8EBF2' : '2px solid #0D1017',
            }}
          >
            {user.name?.[0]?.toUpperCase()}
          </div>
        ))}

        {extra > 0 && (
          <div style={{ ...styles.avatar, background: '#1E2433', color: '#5A6380', marginLeft: -8 }}>
            +{extra}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#00E5C3',
    boxShadow: '0 0 0 3px rgba(0,229,195,0.2)',
    animation: 'pulse 2s infinite',
  },
  count: { fontSize: 11, color: '#5A6380', fontFamily: 'monospace' },
  avatars: { display: 'flex', alignItems: 'center' },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#080A0F',
    cursor: 'default', position: 'relative',
    transition: 'transform 0.2s',
  },
}
