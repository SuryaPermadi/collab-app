export default function CanvasToolbar({ tool, setTool, onDelete, hasSelection }) {
  const tools = [
    { id: 'select', label: '↖', title: 'Select & Move (V)' },
    { type: 'divider' },
    { id: 'rect', label: '▭', title: 'Rectangle (R)' },
    { id: 'circle', label: '○', title: 'Circle (C)' },
    { id: 'text', label: 'T', title: 'Text (T)' },
    { id: 'pen', label: '✏', title: 'Pen / Freehand (P)' },
    { type: 'divider' },
  ]

  return (
    <div style={styles.toolbar}>
      {tools.map((t, i) => {
        if (t.type === 'divider') return <div key={i} style={styles.divider} />
        return (
          <button
            key={t.id}
            title={t.title}
            onClick={() => setTool(t.id)}
            style={{
              ...styles.btn,
              ...(tool === t.id ? styles.btnActive : {}),
            }}
          >
            {t.label}
          </button>
        )
      })}

      {hasSelection && (
        <button
          title="Hapus (Delete)"
          onClick={onDelete}
          style={{ ...styles.btn, color: '#FF4D6D', marginLeft: 'auto' }}
        >
          🗑
        </button>
      )}
    </div>
  )
}

const styles = {
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 2,
    padding: '8px 16px', borderBottom: '1px solid #1E2433',
    background: '#0F1420',
  },
  btn: {
    background: 'none', border: 'none', color: '#5A6380',
    width: 36, height: 36, cursor: 'pointer', fontSize: 16,
    borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
  },
  btnActive: { background: '#1E2433', color: '#00E5C3' },
  divider: { width: 1, height: 24, background: '#1E2433', margin: '0 4px' },
}
