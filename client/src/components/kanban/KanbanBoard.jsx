import { useEffect, useState, useRef } from 'react'
import { getSocket } from '../../hooks/useSocket.js'
import TaskCard from './TaskCard.jsx'
import TaskModal from './TaskModal.jsx'
import BoardToolbar from './BoardToolbar.jsx'
import api from '../../lib/api.js'

export default function KanbanBoard({ roomId }) {
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [members, setMembers] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [addingTask, setAddingTask] = useState(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({ search: '', assignee: '', priority: '', dueSoon: false })
  const boardRef = useRef(null)
  const socket = getSocket()

  // Fetch members untuk filter
  useEffect(() => {
    if (!roomId) return
    api.get(`/rooms/${roomId}/members`)
      .then(({ data }) => setMembers(data))
      .catch(console.error)
  }, [roomId])

  // Filter logic
  const getFilteredTasks = (colId) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return tasks
      .filter(t => t.column_id === colId)
      .filter(t => {
        if (filters.search) {
          const q = filters.search.toLowerCase()
          if (!t.title.toLowerCase().includes(q) &&
            !(t.description || '').toLowerCase().includes(q)) return false
        }
        if (filters.assignee === 'unassigned' && t.assignee_id) return false
        if (filters.assignee && filters.assignee !== 'unassigned' && t.assignee_id !== filters.assignee) return false
        if (filters.priority && t.priority !== filters.priority) return false
        if (filters.dueSoon) {
          if (!t.due_date) return false
          const due = new Date(t.due_date)
          due.setHours(0, 0, 0, 0)
          const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
          if (diff > 3) return false
        }
        return true
      })
      .sort((a, b) => a.position - b.position)
  }

  // Export PDF
  const handleExport = async () => {
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const el = boardRef.current
      const canvas = await html2canvas(el, {
        backgroundColor: '#080A0F',
        scale: 1.5,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`board-${roomId?.slice(0, 8)}.pdf`)
    } catch (err) {
      console.error('Export error:', err)
      alert('Gagal export PDF. Pastikan html2canvas & jspdf sudah terinstall.')
    }
    setExporting(false)
  }

  useEffect(() => {
    if (!socket) return
    socket.emit('board:get')

    const onLoaded = ({ columns, tasks, logs }) => {
      setColumns(columns)
      setTasks(tasks)
      setLogs(logs)
    }

    socket.on('board:loaded', onLoaded)
    socket.on('column:added', ({ column }) => setColumns(p => [...p, column]))
    socket.on('column:updated', ({ column }) => setColumns(p => p.map(c => c.id === column.id ? column : c)))
    socket.on('column:deleted', ({ id }) => {
      setColumns(p => p.filter(c => c.id !== id))
      setTasks(p => p.filter(t => t.column_id !== id))
    })
    socket.on('task:added', ({ task }) => setTasks(p => [...p, task]))
    socket.on('task:updated', ({ task }) => setTasks(p => p.map(t => t.id === task.id ? { ...t, ...task } : t)))
    socket.on('task:moved', ({ task }) => setTasks(p => p.map(t => t.id === task.id ? { ...t, ...task } : t)))
    socket.on('task:deleted', ({ id }) => setTasks(p => p.filter(t => t.id !== id)))
    socket.on('activity:new', (log) => setLogs(p => [log, ...p].slice(0, 20)))

    return () => {
      socket.off('board:loaded', onLoaded)
      socket.off('column:added')
      socket.off('column:updated')
      socket.off('column:deleted')
      socket.off('task:added')
      socket.off('task:updated')
      socket.off('task:moved')
      socket.off('task:deleted')
      socket.off('activity:new')
    }
  }, [socket])

  // ─── Drag & Drop ──────────────────────────────────────
  const handleDragStart = (e, taskId, fromColId) => {
    setDragging({ taskId, fromColId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, colId, position) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver({ colId, position })
  }

  const handleDrop = (e, colId) => {
    e.preventDefault()
    if (!dragging) return

    const colTasks = tasks.filter(t => t.column_id === colId)
    const newPosition = dragOver?.position ?? colTasks.length

    socket?.emit('task:move', {
      taskId: dragging.taskId,
      toColumnId: colId,
      newPosition,
    })

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === dragging.taskId
        ? { ...t, column_id: colId, position: newPosition }
        : t
    ))

    setDragging(null)
    setDragOver(null)
  }

  const addColumn = () => {
    if (!newColTitle.trim()) return
    socket?.emit('column:add', { title: newColTitle })
    setNewColTitle('')
    setAddingCol(false)
  }

  const addTask = (columnId) => {
    if (!newTaskTitle.trim()) return
    socket?.emit('task:add', { columnId, title: newTaskTitle, priority: 'medium' })
    setNewTaskTitle('')
    setAddingTask(null)
  }

  const deleteColumn = (id) => {
    if (confirm('Hapus kolom dan semua task di dalamnya?')) {
      socket?.emit('column:delete', { id })
    }
  }

  const getColTasks = (colId) =>
    tasks.filter(t => t.column_id === colId).sort((a, b) => a.position - b.position)

  return (
    <div style={styles.wrap}>
      {/* Toolbar */}
      <BoardToolbar
        members={members}
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        exporting={exporting}
      />

      <div style={styles.inner}>
        {/* Board */}
        <div style={styles.board} ref={boardRef}>
          {columns.map(col => {
            const filteredTasks = getFilteredTasks(col.id)
            const allColTasks = getColTasks(col.id)
            return (
              <div
                key={col.id}
                style={{
                  ...styles.column,
                  outline: dragOver?.colId === col.id ? `2px solid ${col.color}` : 'none',
                }}
                onDragOver={(e) => handleDragOver(e, col.id, allColTasks.length)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div style={styles.colHeader}>
                  <div style={styles.colLeft}>
                    <div style={{ ...styles.colDot, background: col.color }} />
                    <span style={styles.colTitle}>{col.title}</span>
                    <span style={styles.colCount}>
                      {filteredTasks.length}{filteredTasks.length !== allColTasks.length ? `/${allColTasks.length}` : ''}
                    </span>
                  </div>
                  <button
                    style={styles.iconBtn}
                    onClick={() => deleteColumn(col.id)}
                    title="Hapus kolom"
                  >✕</button>
                </div>

                {/* Tasks */}
                <div style={styles.taskList}>
                  {filteredTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                      onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, col.id, idx) }}
                      style={{ opacity: dragging?.taskId === task.id ? 0.4 : 1 }}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => setSelectedTask(task)}
                      />
                    </div>
                  ))}
                </div>

                {/* Add Task */}
                {addingTask === col.id ? (
                  <div style={styles.addTaskForm}>
                    <input
                      style={styles.input}
                      placeholder="Nama task..."
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addTask(col.id)
                        if (e.key === 'Escape') setAddingTask(null)
                      }}
                      autoFocus
                    />
                    <div style={styles.addTaskActions}>
                      <button style={styles.btnAdd} onClick={() => addTask(col.id)}>Tambah</button>
                      <button style={styles.btnCancel} onClick={() => setAddingTask(null)}>Batal</button>
                    </div>
                  </div>
                ) : (
                  <button
                    style={styles.addTaskBtn}
                    onClick={() => { setAddingTask(col.id); setNewTaskTitle('') }}
                  >
                    + Tambah Task
                  </button>
                )}
              </div>
            )
          })}

          {/* Add Column */}
          <div style={styles.addColWrap}>
            {addingCol ? (
              <div style={styles.addColForm}>
                <input
                  style={styles.input}
                  placeholder="Nama kolom..."
                  value={newColTitle}
                  onChange={e => setNewColTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addColumn()
                    if (e.key === 'Escape') setAddingCol(false)
                  }}
                  autoFocus
                />
                <div style={styles.addTaskActions}>
                  <button style={styles.btnAdd} onClick={addColumn}>Tambah</button>
                  <button style={styles.btnCancel} onClick={() => setAddingCol(false)}>Batal</button>
                </div>
              </div>
            ) : (
              <button style={styles.addColBtn} onClick={() => setAddingCol(true)}>
                + Kolom Baru
              </button>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={styles.feed}>
          <div style={styles.feedTitle}>
            <span style={{ color: '#00E5C3' }}>⚡</span> Aktivitas
          </div>
          {logs.length === 0 ? (
            <div style={styles.feedEmpty}>Belum ada aktivitas</div>
          ) : (
            logs.map((log, i) => (
              <div key={log.id || i} style={styles.feedItem}>
                <span style={styles.feedUser}>{log.user_name}</span>
                <span style={styles.feedAction}> {log.action}</span>
                <div style={styles.feedTime}>
                  {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          roomId={roomId}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            socket?.emit('task:update', { id: selectedTask.id, updates })
            setSelectedTask(prev => ({ ...prev, ...updates }))
          }}
          onDelete={() => {
            socket?.emit('task:delete', { id: selectedTask.id })
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    background: '#080A0F',
  },
  inner: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },
  board: {
    flex: 1, display: 'flex', gap: 16, padding: 24,
    overflowX: 'auto', alignItems: 'flex-start',
  },
  column: {
    width: 280, flexShrink: 0,
    background: '#0F1420', border: '1px solid #1E2433',
    display: 'flex', flexDirection: 'column',
    maxHeight: 'calc(100vh - 120px)',
    borderRadius: 2,
  },
  colHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid #1E2433',
  },
  colLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  colDot: { width: 8, height: 8, borderRadius: '50%' },
  colTitle: { fontSize: 13, fontWeight: 600, color: '#E8EBF2' },
  colCount: {
    fontSize: 11, color: '#5A6380', background: '#1E2433',
    padding: '1px 6px', borderRadius: 10, fontFamily: 'monospace',
  },
  iconBtn: {
    background: 'none', border: 'none', color: '#5A6380',
    cursor: 'pointer', fontSize: 12, padding: '2px 4px',
    transition: 'color 0.2s',
  },
  taskList: {
    flex: 1, overflowY: 'auto', padding: '12px 12px 0',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  addTaskForm: { padding: 12 },
  addTaskActions: { display: 'flex', gap: 8, marginTop: 8 },
  addTaskBtn: {
    margin: 12, padding: '8px 12px',
    background: 'none', border: '1px dashed #1E2433',
    color: '#5A6380', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left',
  },
  addColWrap: { width: 280, flexShrink: 0 },
  addColForm: {
    background: '#0F1420', border: '1px solid #1E2433',
    padding: 16,
  },
  addColBtn: {
    width: '100%', padding: '12px 16px',
    background: 'none', border: '1px dashed #1E2433',
    color: '#5A6380', cursor: 'pointer', fontSize: 13,
    fontFamily: 'inherit', textAlign: 'left',
  },
  input: {
    width: '100%', background: '#080A0F', border: '1px solid #1E2433',
    color: '#E8EBF2', padding: '8px 12px', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  btnAdd: {
    background: '#00E5C3', color: '#080A0F', border: 'none',
    padding: '6px 14px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', fontWeight: 700,
  },
  btnCancel: {
    background: 'none', color: '#5A6380', border: '1px solid #1E2433',
    padding: '6px 14px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit',
  },
  feed: {
    width: 260, flexShrink: 0, borderLeft: '1px solid #1E2433',
    padding: 16, overflowY: 'auto', background: '#0D1017',
  },
  feedTitle: {
    fontSize: 12, fontFamily: 'monospace', color: '#5A6380',
    letterSpacing: '0.1em', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  feedEmpty: { fontSize: 12, color: '#5A6380', textAlign: 'center', marginTop: 40 },
  feedItem: {
    padding: '10px 0', borderBottom: '1px solid #1E2433',
    fontSize: 12, lineHeight: 1.6,
  },
  feedUser: { color: '#00E5C3', fontWeight: 600 },
  feedAction: { color: '#5A6380' },
  feedTime: { fontSize: 10, color: '#3A4255', marginTop: 2, fontFamily: 'monospace' },
}