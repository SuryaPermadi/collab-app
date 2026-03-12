import { useState } from 'react'
import { getSocket } from '../../hooks/useSocket.js'
import { useClerkUser } from '../../hooks/useClerkUser.js'

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '✅', '😂', '🎉', '👀', '⚡']

export default function EmojiReactions({ taskId, reactions = [] }) {
    const [showPicker, setShowPicker] = useState(false)
    const socket = getSocket()
    const { user } = useClerkUser()

    const toggle = (emoji) => {
        socket?.emit('reaction:toggle', { taskId, emoji })
        setShowPicker(false)
    }

    const myReactions = reactions
        .filter(r => r.users?.includes(user?.name))
        .map(r => r.emoji)

    return (
        <div style={styles.wrap} onClick={e => e.stopPropagation()}>
            {/* Existing reactions */}
            <div style={styles.reactionRow}>
                {reactions.map(r => (
                    <button
                        key={r.emoji}
                        style={{
                            ...styles.reactionBtn,
                            background: myReactions.includes(r.emoji) ? 'rgba(0,229,195,0.15)' : 'var(--bgPanel)',
                            borderColor: myReactions.includes(r.emoji) ? 'var(--accent)' : 'var(--border)',
                        }}
                        onClick={() => toggle(r.emoji)}
                        title={r.users?.join(', ')}
                    >
                        {r.emoji} <span style={styles.count}>{r.count}</span>
                    </button>
                ))}

                {/* Add reaction button */}
                <button
                    style={styles.addBtn}
                    onClick={() => setShowPicker(v => !v)}
                    title="Tambah reaksi"
                >
                    {showPicker ? '✕' : '＋'}
                </button>
            </div>

            {/* Emoji picker */}
            {showPicker && (
                <div style={styles.picker}>
                    {EMOJI_OPTIONS.map(emoji => (
                        <button
                            key={emoji}
                            style={{
                                ...styles.pickerEmoji,
                                background: myReactions.includes(emoji) ? 'rgba(0,229,195,0.15)' : 'none',
                            }}
                            onClick={() => toggle(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const styles = {
    wrap: { position: 'relative', marginTop: 6 },
    reactionRow: { display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
    reactionBtn: {
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', border: '1px solid',
        background: 'none', cursor: 'pointer',
        fontSize: 12, borderRadius: 20,
        transition: 'all 0.15s',
    },
    count: { fontSize: 10, color: 'var(--textMuted)', fontFamily: 'monospace' },
    addBtn: {
        width: 24, height: 22, border: '1px dashed var(--border)',
        background: 'none', color: 'var(--textMuted)',
        cursor: 'pointer', fontSize: 12, borderRadius: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
    },
    picker: {
        position: 'absolute', bottom: '100%', left: 0,
        background: 'var(--bgCard)', border: '1px solid var(--border)',
        padding: 8, display: 'flex', gap: 4, flexWrap: 'wrap',
        zIndex: 100, marginBottom: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        width: 180,
    },
    pickerEmoji: {
        width: 32, height: 32, border: 'none',
        background: 'none', cursor: 'pointer',
        fontSize: 18, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
    },
}