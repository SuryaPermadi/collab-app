const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#00E5C3', bg: 'rgba(0,229,195,0.1)' },
  medium: { label: 'Medium', color: '#FFB347', bg: 'rgba(255,179,71,0.1)' },
  high: { label: 'High', color: '#FF4D6D', bg: 'rgba(255,77,109,0.1)' },
}

export default function TaskCard({ task, onClick }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div style={styles.card} onClick={onClick}>
      {/* Priority + Due Date */}
      <div style={styles.topRow}>
        <span style={{ ...styles.priority, color: priority.color, background: priority.bg }}>
          {priority.label}
        </span>
        {task.due_date && (
          <span style={{ ...styles.dueDate, color: isOverdue ? '#FF4D6D' : '#5A6380' }}>
            📅 {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={styles.title}>{task.title}</div>

      {/* Description preview */}
      {task.description && (
        <div style={styles.desc}>
          {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
        </div>
      )}

      {/* Assignee — tampil jelas di bawah title */}
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

      {/* Labels */}
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
    background: '#111520', border: '1px solid #1E2433',
    padding: '12px 14px', cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    userSelect: 'none',
  },
  topRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  priority: {
    fontSize: 10, fontFamily: 'monospace',
    padding: '2px 6px', letterSpacing: '0.05em', fontWeight: 700,
  },
  dueDate: { fontSize: 10, fontFamily: 'monospace' },
  title: {
    fontSize: 13, fontWeight: 600, color: '#E8EBF2',
    lineHeight: 1.4, marginBottom: 6,
  },
  desc: {
    fontSize: 11, color: '#5A6380', lineHeight: 1.5, marginBottom: 10,
  },

  // ─── Assignee styles ──────────────────────────────────
  assigneeRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#0D1017', border: '1px solid #1E2433',
    padding: '6px 10px', marginBottom: 8,
  },
  avatarCircle: {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#080A0F', flexShrink: 0,
  },
  assigneeInfo: {
    display: 'flex', flexDirection: 'column', gap: 1,
  },
  assigneeLabel: {
    fontSize: 9, color: '#3A4255', fontFamily: 'monospace',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  assigneeName: {
    fontSize: 12, color: '#E8EBF2', fontWeight: 600,
  },
  unassigned: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 10px', marginBottom: 8,
    border: '1px dashed #1E2433',
  },
  unassignedIcon: { fontSize: 12, opacity: 0.4 },
  unassignedText: {
    fontSize: 11, color: '#3A4255', fontStyle: 'italic',
  },

  labels: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  label: {
    fontSize: 10, background: '#1E2433', color: '#5A6380',
    padding: '2px 6px', borderRadius: 2,
  },
}