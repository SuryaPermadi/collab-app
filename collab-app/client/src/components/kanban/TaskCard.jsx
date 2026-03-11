const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#00E5C3', bg: 'rgba(0,229,195,0.1)' },
  medium: { label: 'Medium', color: '#FFB347', bg: 'rgba(255,179,71,0.1)' },
  high: { label: 'High', color: '#FF4D6D', bg: 'rgba(255,77,109,0.1)' },
}

function getDueDateStatus(dueDate) {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  // Tambah T00:00:00 agar tidak timezone issue
  const due = new Date(dueDate.includes('T') ? dueDate.split('T')[0] + 'T00:00:00' : dueDate + 'T00:00:00')
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  if (diff < 0) return { label: 'Overdue!', color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', pulse: true }
  if (diff === 0) return { label: 'Hari ini!', color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', pulse: true }
  if (diff === 1) return { label: 'Besok ⚠️', color: '#FF4D6D', bg: 'rgba(255,77,109,0.05)', pulse: false }
  if (diff <= 3) return { label: `${diff} hari lagi`, color: '#FFB347', bg: 'rgba(255,179,71,0.05)', pulse: false }
  return { label: `${diff} hari lagi`, color: 'var(--textMuted)', bg: 'transparent', pulse: false }
}

export default function TaskCard({ task, onClick }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const dueDateStatus = getDueDateStatus(task.due_date)
  const isUrgent = dueDateStatus?.color === '#FF4D6D'

  return (
    <div
      style={{
        ...styles.card,
        borderColor: isUrgent ? 'rgba(255,77,109,0.4)' : 'var(--border)',
        background: isUrgent ? dueDateStatus.bg : 'var(--bgCard)',
      }}
      onClick={onClick}
    >
      <div style={styles.topRow}>
        <span style={{ ...styles.priority, color: priority.color, background: priority.bg }}>
          {priority.label}
        </span>
        {dueDateStatus && (
          <span style={{ ...styles.dueDate, color: dueDateStatus.color, fontWeight: isUrgent ? 700 : 400 }}>
            {dueDateStatus.pulse && <span style={styles.pulseDot} />}
            📅 {dueDateStatus.label}
          </span>
        )}
      </div>

      <div style={styles.title}>{task.title}</div>

      {task.description && (
        <div style={styles.desc}>
          {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
        </div>
      )}

      {task.assignee_name ? (
        <div style={styles.assigneeRow}>
          <div style={{ ...styles.avatarCircle, background: task.assignee_color || '#7B61FF' }}>
            {task.assignee_name[0].toUpperCase()}
          </div>
          <div style={styles.assigneeInfo}>
            <span style={styles.assigneeLabel}>Ditugaskan ke</span>
            <span style={styles.assigneeName}>{task.assignee_name}</span>
          </div>
        </div>
      ) : (
        <div style={styles.unassigned}>
          <span style={styles.unassignedIcon}>👤</span>
          <span style={styles.unassignedText}>Belum ada assignee</span>
        </div>
      )}

      {(task.labels || []).length > 0 && (
        <div style={styles.labels}>
          {task.labels.slice(0, 3).map(label => (
            <span key={label} style={styles.label}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    border: '1px solid', padding: '12px 14px', cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s', userSelect: 'none',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priority: { fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', letterSpacing: '0.05em', fontWeight: 700 },
  dueDate: { fontSize: 10, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 },
  pulseDot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF4D6D' },
  title: { fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 },
  desc: { fontSize: 11, color: 'var(--textMuted)', lineHeight: 1.5, marginBottom: 10 },
  assigneeRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg)', border: '1px solid #1E2433',
    padding: '6px 10px', marginBottom: 8,
  },
  avatarCircle: {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: 'var(--bg)', flexShrink: 0,
  },
  assigneeInfo: { display: 'flex', flexDirection: 'column', gap: 1 },
  assigneeLabel: { fontSize: 9, color: 'var(--textDim)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' },
  assigneeName: { fontSize: 12, color: 'var(--text)', fontWeight: 600 },
  unassigned: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', marginBottom: 8, border: '1px dashed #1E2433' },
  unassignedIcon: { fontSize: 12, opacity: 0.4 },
  unassignedText: { fontSize: 11, color: 'var(--textDim)', fontStyle: 'italic' },
  labels: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  label: { fontSize: 10, background: 'var(--border)', color: 'var(--textMuted)', padding: '2px 6px', borderRadius: 2 },
}