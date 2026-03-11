import { useState, useEffect } from 'react'
import { getSocket } from '../../hooks/useSocket.js'

export default function SubtaskList({ taskId, colors }) {
    const [subtasks, setSubtasks] = useState([])
    const [newTitle, setNewTitle] = useState('')
    const [adding, setAdding] = useState(false)
    const socket = getSocket()

    const c = colors

    useEffect(() => {
        if (!socket || !taskId) return
        socket.emit('subtask:get', { taskId })

        const onLoaded = ({ taskId: tid, subtasks }) => {
            if (tid === taskId) setSubtasks(subtasks)
        }
        const onAdded = ({ taskId: tid, subtask }) => {
            if (tid === taskId) setSubtasks(p => [...p, subtask])
        }
        const onToggled = ({ taskId: tid, subtask }) => {
            if (tid === taskId) setSubtasks(p => p.map(s => s.id === subtask.id ? subtask : s))
        }
        const onDeleted = ({ taskId: tid, id }) => {
            if (tid === taskId) setSubtasks(p => p.filter(s => s.id !== id))
        }

        socket.on('subtask:loaded', onLoaded)
        socket.on('subtask:added', onAdded)
        socket.on('subtask:toggled', onToggled)
        socket.on('subtask:deleted', onDeleted)

        return () => {
            socket.off('subtask:loaded', onLoaded)
            socket.off('subtask:added', onAdded)
            socket.off('subtask:toggled', onToggled)
            socket.off('subtask:deleted', onDeleted)
        }
    }, [socket, taskId])

    const addSubtask = () => {
        if (!newTitle.trim()) return
        socket?.emit('subtask:add', { taskId, title: newTitle.trim() })
        setNewTitle('')
        setAdding(false)
    }

    const toggle = (id) => socket?.emit('subtask:toggle', { id, taskId })
    const remove = (id) => socket?.emit('subtask:delete', { id, taskId })

    const done = subtasks.filter(s => s.done).length
    const total = subtasks.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0

    return (
        <div style={{ marginTop: 4 }}>
            {/* Progress bar */}
            {total > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: c.textMuted }}>
                            {done}/{total} selesai
                        </span>
                        <span style={{ fontSize: 11, color: pct === 100 ? c.accent : c.textMuted, fontFamily: 'monospace' }}>
                            {pct}%
                        </span>
                    </div>
                    <div style={{ background: c.border, height: 4 }}>
                        <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: pct === 100 ? c.accent : c.accentPurple,
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </div>
            )}

            {/* Subtask list */}
            {subtasks.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${c.border}` }}>
                    <button
                        onClick={() => toggle(s.id)}
                        style={{
                            width: 16, height: 16, border: `2px solid`,
                            borderColor: s.done ? c.accent : c.border,
                            background: s.done ? c.accent : 'none',
                            cursor: 'pointer', flexShrink: 0, padding: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: c.bg, fontWeight: 700,
                            transition: 'all 0.15s',
                        }}
                    >
                        {s.done ? '✓' : ''}
                    </button>
                    <span style={{
                        flex: 1, fontSize: 12, color: s.done ? c.textDim : c.text,
                        textDecoration: s.done ? 'line-through' : 'none',
                    }}>
                        {s.title}
                    </span>
                    <button
                        onClick={() => remove(s.id)}
                        style={{ background: 'none', border: 'none', color: c.textDim, cursor: 'pointer', fontSize: 14, padding: 0 }}
                    >×</button>
                </div>
            ))}

            {/* Add subtask */}
            {adding ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input
                        style={{
                            flex: 1, background: c.bgInput, border: `1px solid ${c.border}`,
                            color: c.text, padding: '5px 8px', fontSize: 12,
                            fontFamily: 'inherit', outline: 'none',
                        }}
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') addSubtask()
                            if (e.key === 'Escape') setAdding(false)
                        }}
                        placeholder="Nama sub-task..."
                        autoFocus
                    />
                    <button onClick={addSubtask} style={{ background: c.accent, border: 'none', color: c.bg, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 700 }}>
                        +
                    </button>
                    <button onClick={() => setAdding(false)} style={{ background: 'none', border: `1px solid ${c.border}`, color: c.textMuted, padding: '5px 8px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                        Batal
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: '6px 0', marginTop: 4 }}
                >
                    + Tambah sub-task
                </button>
            )}
        </div>
    )
}