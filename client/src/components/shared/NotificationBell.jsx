import { useState, useRef, useEffect } from 'react'
import { useNotifStore } from '../../stores/notifStore.js'

const NOTIF_ICONS = {
    assigned: '🎯',
    due_urgent: '⚠️',
    due_warning: '📅',
}

const NOTIF_COLORS = {
    assigned: '#7B61FF',
    due_urgent: '#FF4D6D',
    due_warning: '#FFB347',
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false)
    const { notifs, unreadCount, markAllRead, markRead, clearAll } = useNotifStore()
    const ref = useRef(null)

    // Tutup dropdown kalau klik di luar
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleOpen = () => {
        setOpen(o => !o)
        if (!open && unreadCount > 0) {
            setTimeout(markAllRead, 1500)
        }
    }

    return (
        <div ref={ref} style={styles.wrap}>
            {/* Bell Button */}
            <button style={styles.bell} onClick={handleOpen} title="Notifikasi">
                🔔
                {unreadCount > 0 && (
                    <span style={styles.badge}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={styles.dropdown}>
                    <div style={styles.dropHeader}>
                        <span style={styles.dropTitle}>Notifikasi</span>
                        {notifs.length > 0 && (
                            <button style={styles.clearBtn} onClick={clearAll}>Hapus semua</button>
                        )}
                    </div>

                    {notifs.length === 0 ? (
                        <div style={styles.empty}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                            <div>Belum ada notifikasi</div>
                        </div>
                    ) : (
                        <div style={styles.list}>
                            {notifs.map(notif => (
                                <div
                                    key={notif.id}
                                    style={{
                                        ...styles.item,
                                        background: notif.read ? 'transparent' : 'rgba(123,97,255,0.05)',
                                        borderLeft: `3px solid ${notif.read ? 'transparent' : NOTIF_COLORS[notif.type] || '#7B61FF'}`,
                                    }}
                                    onClick={() => markRead(notif.id)}
                                >
                                    <div style={styles.itemIcon}>
                                        {NOTIF_ICONS[notif.type] || '🔔'}
                                    </div>
                                    <div style={styles.itemContent}>
                                        <div style={styles.itemTitle}>{notif.title}</div>
                                        <div style={styles.itemMsg}>{notif.message}</div>
                                        <div style={styles.itemTime}>
                                            {formatTime(notif.createdAt)}
                                        </div>
                                    </div>
                                    {!notif.read && <div style={styles.unreadDot} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function formatTime(date) {
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000)
    if (diff < 60) return 'Baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return new Date(date).toLocaleDateString('id-ID')
}

const styles = {
    wrap: { position: 'relative' },

    bell: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 18, padding: '4px 8px', position: 'relative',
        transition: 'transform 0.2s',
    },

    badge: {
        position: 'absolute', top: 0, right: 0,
        background: '#FF4D6D', color: '#fff',
        fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
        width: 16, height: 16, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #080A0F',
    },

    dropdown: {
        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
        width: 320, background: '#0F1420', border: '1px solid #1E2433',
        zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },

    dropHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid #1E2433',
    },

    dropTitle: {
        fontSize: 12, fontFamily: 'monospace', color: '#5A6380',
        letterSpacing: '0.1em', textTransform: 'uppercase',
    },

    clearBtn: {
        background: 'none', border: 'none', color: '#5A6380',
        fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
    },

    empty: {
        padding: '40px 20px', textAlign: 'center',
        color: '#5A6380', fontSize: 12,
    },

    list: { maxHeight: 360, overflowY: 'auto' },

    item: {
        display: 'flex', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid #1E2433', cursor: 'pointer',
        transition: 'background 0.15s',
    },

    itemIcon: { fontSize: 18, flexShrink: 0, marginTop: 2 },

    itemContent: { flex: 1, minWidth: 0 },

    itemTitle: {
        fontSize: 12, fontWeight: 700, color: '#E8EBF2', marginBottom: 2,
    },

    itemMsg: {
        fontSize: 11, color: '#5A6380', lineHeight: 1.4, marginBottom: 4,
        wordBreak: 'break-word',
    },

    itemTime: {
        fontSize: 10, color: '#3A4255', fontFamily: 'monospace',
    },

    unreadDot: {
        width: 6, height: 6, borderRadius: '50%',
        background: '#7B61FF', flexShrink: 0, marginTop: 6,
    },
}