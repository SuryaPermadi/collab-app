// Overlay HTML di atas canvas/editor untuk menampilkan kursor user lain
export default function LiveCursors({ cursors, currentUserId }) {
  const others = Object.entries(cursors).filter(([uid]) => uid !== currentUserId)
  if (others.length === 0) return null

  return (
    <div style={styles.overlay}>
      {others.map(([uid, cur]) => (
        <div
          key={uid}
          style={{
            ...styles.cursorWrap,
            transform: `translate(${cur.x}px, ${cur.y}px)`,
          }}
        >
          {/* Kursor panah SVG */}
          <svg width="16" height="20" viewBox="0 0 16 20" style={styles.arrow}>
            <path
              d="M0 0 L0 14 L4 10 L7 17 L9 16 L6 9 L11 9 Z"
              fill={cur.avatarColor || '#00E5C3'}
              stroke="#000"
              strokeWidth="0.5"
            />
          </svg>

          {/* Label nama */}
          <div style={{
            ...styles.label,
            background: cur.avatarColor || '#00E5C3',
          }}>
            {cur.name}
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute', inset: 0,
    pointerEvents: 'none', overflow: 'hidden',
    zIndex: 100,
  },
  cursorWrap: {
    position: 'absolute', top: 0, left: 0,
    display: 'flex', alignItems: 'flex-start', gap: 4,
    transition: 'transform 0.05s linear',
    willChange: 'transform',
  },
  arrow: {
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
    flexShrink: 0,
  },
  label: {
    marginTop: 14,
    color: '#080A0F', fontSize: 10, fontWeight: 700,
    fontFamily: 'monospace', padding: '2px 6px',
    borderRadius: 3, whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
}