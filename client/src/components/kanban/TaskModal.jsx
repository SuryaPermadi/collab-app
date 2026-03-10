import { useState } from 'react'

const PRIORITIES = ['low', 'medium', 'high']
const PRIORITY_COLORS = { low: '#00E5C3', medium: '#FFB347', high: '#FF4D6D' }

export default function TaskModal({ task, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState(task.labels || [])
  const [edited, setEdited] = useState(false)

  const handleSave = () => {
    onUpdate({ title, description, priority, due_date: dueDate || null, labels })
    setEdited(false)
  }

  const addLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      const newLabels = [...new Set([...labels, labelInput.trim()])]
      setLabels(newLabels)
      setLabelInput('')
      setEdited(true)
    }
  }

  const removeLabel = (label) => {
    setLabels(labels.filter(l => l !== label))
    setEdited(true)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <input
            style={styles.titleInput}
            value={title}
            onChange={e => { setTitle(e.target.value); setEdited(true) }}
          />
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {/* Left */}
          <div style={styles.main}>
            {/* Description */}
            <div style={styles.field}>
              <label style={styles.label}>Deskripsi</label>
              <textarea
                style={styles.textarea}
                value={description}
                onChange={e => { setDescription(e.target.value); setEdited(true) }}
                placeholder="Tambah deskripsi..."
                rows={5}
              />
            </div>

            {/* Labels */}
            <div style={styles.field}>
              <label style={styles.label}>Label</label>
              <div style={styles.labelsWrap}>
                {labels.map(l => (
                  <span key={l} style={styles.labelChip}>
                    {l}
                    <button style={styles.removeLabelBtn} onClick={() => removeLabel(l)}>×</button>
                  </span>
                ))}
                <input
                  style={styles.labelInput}
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  onKeyDown={addLabel}
                  placeholder="Ketik + Enter..."
                />
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={styles.sidebar}>
            {/* Priority */}
            <div style={styles.field}>
              <label style={styles.label}>Prioritas</label>
              <div style={styles.priorityGroup}>
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    style={{
                      ...styles.priorityBtn,
                      borderColor: priority === p ? PRIORITY_COLORS[p] : '#1E2433',
                      color: priority === p ? PRIORITY_COLORS[p] : '#5A6380',
                      background: priority === p ? `${PRIORITY_COLORS[p]}15` : 'none',
                    }}
                    onClick={() => { setPriority(p); setEdited(true) }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div style={styles.field}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                style={styles.dateInput}
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); setEdited(true) }}
              />
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              {edited && (
                <button style={styles.btnSave} onClick={handleSave}>
                  💾 Simpan
                </button>
              )}
              <button style={styles.btnDelete} onClick={onDelete}>
                🗑 Hapus Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, fontFamily: "'DM Sans', sans-serif",
  },
  modal: {
    background: '#0F1420', border: '1px solid #1E2433',
    width: 680, maxWidth: '95vw', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 20px', borderBottom: '1px solid #1E2433',
  },
  titleInput: {
    flex: 1, background: 'none', border: 'none', color: '#E8EBF2',
    fontSize: 18, fontWeight: 700, fontFamily: 'inherit', outline: 'none',
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#5A6380',
    cursor: 'pointer', fontSize: 16, padding: '4px 8px',
  },
  body: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },
  main: {
    flex: 1, padding: 20, overflowY: 'auto',
    borderRight: '1px solid #1E2433',
  },
  sidebar: {
    width: 200, padding: 20, display: 'flex',
    flexDirection: 'column', gap: 20,
  },
  field: { marginBottom: 20 },
  label: {
    display: 'block', fontSize: 11, color: '#5A6380',
    fontFamily: 'monospace', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 8,
  },
  textarea: {
    width: '100%', background: '#080A0F', border: '1px solid #1E2433',
    color: '#E8EBF2', padding: '10px 12px', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', resize: 'vertical',
    lineHeight: 1.6, boxSizing: 'border-box',
  },
  labelsWrap: {
    display: 'flex', flexWrap: 'wrap', gap: 6,
    background: '#080A0F', border: '1px solid #1E2433',
    padding: '8px', minHeight: 40,
  },
  labelChip: {
    background: '#1E2433', color: '#E8EBF2', padding: '2px 8px',
    fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
  },
  removeLabelBtn: {
    background: 'none', border: 'none', color: '#5A6380',
    cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
  },
  labelInput: {
    background: 'none', border: 'none', color: '#5A6380',
    fontSize: 12, fontFamily: 'inherit', outline: 'none',
    minWidth: 100,
  },
  priorityGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  priorityBtn: {
    background: 'none', border: '1px solid',
    padding: '6px 10px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
  },
  dateInput: {
    width: '100%', background: '#080A0F', border: '1px solid #1E2433',
    color: '#E8EBF2', padding: '8px 10px', fontSize: 12,
    fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
  },
  actions: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' },
  btnSave: {
    background: '#00E5C3', color: '#080A0F', border: 'none',
    padding: '8px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', fontWeight: 700,
  },
  btnDelete: {
    background: 'none', color: '#FF4D6D',
    border: '1px solid rgba(255,77,109,0.3)',
    padding: '8px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit',
  },
}
