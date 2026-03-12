import { useState, useEffect, useRef } from 'react'
import { getSocket } from '../../hooks/useSocket.js'
import { useClerkUser } from '../../hooks/useClerkUser.js'

export default function RoomChat({ roomId }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [typingUsers, setTypingUsers] = useState({})
    const [isOpen, setIsOpen] = useState(false)
    const [unread, setUnread] = useState(0)
    const bottomRef = useRef(null)
    const typingTimer = useRef(null)
    const socket = getSocket()
    const { user } = useClerkUser()

    useEffect(() => {
        if (!socket || !roomId) return
        const timer = setTimeout(() => socket.emit('chat:get'), 400)

        const onLoaded = ({ messages }) => setMessages(messages)
        const onMessage = (msg) => {
            setMessages(p => [...p, msg])
            setUnread(p => p + 1)
        }
        const onTyping = ({ userId, name, isTyping }) => {
            setTypingUsers(p => {
                if (isTyping) return { ...p, [userId]: name }
                const next = { ...p }
                delete next[userId]
                return next
            })
        }

        socket.on('chat:loaded', onLoaded)
        socket.on('chat:message', onMessage)
        socket.on('chat:typing', onTyping)

        return () => {
            clearTimeout(timer)
            socket.off('chat:loaded', onLoaded)
            socket.off('chat:message', onMessage)
            socket.off('chat:typing', onTyping)
        }
    }, [socket, roomId])

    useEffect(() => {
        if (isOpen) {
            setUnread(0)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
    }, [isOpen, messages.length])

    const sendMessage = () => {
        if (!input.trim()) return
        socket?.emit('chat:send', { content: input.trim() })
        socket?.emit('chat:typing', { isTyping: false })
        setInput('')
    }

    const handleTyping = (e) => {
        setInput(e.target.value)
        socket?.emit('chat:typing', { isTyping: true })
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            socket?.emit('chat:typing', { isTyping: false })
        }, 1500)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const typingNames = Object.entries(typingUsers)
        .filter(([uid]) => uid !== user?.id)
        .map(([, name]) => name)

    const formatTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    return (
        <>
            <button style={styles.toggleBtn} onClick={() => setIsOpen(v => !v)} title="Chat">
                💬
                {unread > 0 && !isOpen && (
                    <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {isOpen && (
                <div style={styles.panel}>
                    <div style={styles.header}>
                        <span style={styles.headerTitle}>💬 Chat Room</span>
                        <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div style={styles.messages}>
                        {messages.length === 0 ? (
                            <div style={styles.empty}>Belum ada pesan. Mulai ngobrol! 👋</div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMe = msg.user_id === user?.id
                                const prev = messages[i - 1]
                                const sameUser = prev?.user_id === msg.user_id &&
                                    (new Date(msg.created_at) - new Date(prev.created_at)) < 60000

                                return (
                                    <div key={msg.id} style={{
                                        ...styles.msgRow,
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginTop: sameUser ? 2 : 12,
                                    }}>
                                        {!isMe && (
                                            <div style={{ width: 28, flexShrink: 0 }}>
                                                {!sameUser && (
                                                    <div style={{ ...styles.avatar, background: msg.avatar_color || '#7B61FF' }}>
                                                        {msg.user_name?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ maxWidth: '72%' }}>
                                            {!isMe && !sameUser && (
                                                <div style={styles.msgName}>{msg.user_name}</div>
                                            )}
                                            <div style={{
                                                ...styles.bubble,
                                                background: isMe ? 'var(--accent)' : 'var(--bgPanel)',
                                                color: isMe ? '#080A0F' : 'var(--text)',
                                                borderRadius: isMe
                                                    ? sameUser ? '12px 4px 4px 12px' : '12px 4px 12px 12px'
                                                    : sameUser ? '4px 12px 12px 4px' : '4px 12px 12px 12px',
                                            }}>
                                                {msg.content}
                                            </div>
                                            <div style={{ ...styles.time, textAlign: isMe ? 'right' : 'left' }}>
                                                {formatTime(msg.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}

                        {typingNames.length > 0 && (
                            <div style={styles.typing}>
                                ✏️ {typingNames.join(', ')} sedang mengetik...
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div style={styles.inputRow}>
                        <textarea
                            style={styles.input}
                            placeholder="Ketik pesan... (Enter kirim)"
                            value={input}
                            onChange={handleTyping}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button
                            style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
                            onClick={sendMessage}
                            disabled={!input.trim()}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

const styles = {
    toggleBtn: {
        position: 'relative',
        background: 'none',
        border: 'none',
        color: 'var(--text)',
        width: 38, height: 38,
        cursor: 'pointer', fontSize: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    badge: {
        position: 'absolute', top: -6, right: -6,
        background: '#FF4D6D', color: '#fff',
        fontSize: 9, fontWeight: 700,
        width: 16, height: 16, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    panel: {
        position: 'fixed', bottom: 80, right: 20,
        width: 320, height: 460,
        background: 'var(--bgCard)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bgPanel)',
    },
    headerTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
    closeBtn: { background: 'none', border: 'none', color: 'var(--textMuted)', cursor: 'pointer', fontSize: 14 },
    messages: {
        flex: 1, overflowY: 'auto', padding: '12px 12px 8px',
        display: 'flex', flexDirection: 'column',
    },
    empty: {
        textAlign: 'center', color: 'var(--textMuted)',
        fontSize: 12, margin: 'auto', padding: 20,
    },
    msgRow: { display: 'flex', alignItems: 'flex-end', gap: 6 },
    avatar: {
        width: 26, height: 26, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#080A0F',
    },
    msgName: { fontSize: 10, color: 'var(--textMuted)', fontFamily: 'monospace', marginBottom: 2, paddingLeft: 2 },
    bubble: { padding: '7px 11px', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' },
    time: { fontSize: 9, color: 'var(--textDim)', fontFamily: 'monospace', marginTop: 2, paddingLeft: 2, paddingRight: 2 },
    typing: { fontSize: 11, color: 'var(--textMuted)', padding: '4px 0', fontStyle: 'italic' },
    inputRow: {
        display: 'flex', gap: 8, padding: '10px 12px',
        borderTop: '1px solid var(--border)', background: 'var(--bgPanel)',
    },
    input: {
        flex: 1, background: 'var(--bgInput)', border: '1px solid var(--border)',
        color: 'var(--text)', padding: '8px 10px',
        fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.4,
    },
    sendBtn: {
        background: 'var(--accent)', border: 'none', color: '#080A0F',
        width: 36, height: 36, cursor: 'pointer', fontSize: 14, fontWeight: 700,
        flexShrink: 0, alignSelf: 'flex-end',
    },
}