import { useEffect } from 'react'
import { useNotifStore } from '../stores/notifStore.js'
import { useAuthStore } from '../stores/index.js'
import { getSocket } from './useSocket.js'

export function useNotifications() {
    const { addNotif } = useNotifStore()
    const user = useAuthStore(s => s.user)
    const socket = getSocket()

    // ─── Minta izin browser notification ─────────────────
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // ─── Listen event assign dari socket ─────────────────
    useEffect(() => {
        if (!socket || !user) return

        const handleTaskUpdated = ({ task }) => {
            // Cek apakah task ini di-assign ke user yang sedang login
            if (task.assignee_id !== user.id) return
            if (task.assignee_id === task.prev_assignee_id) return

            const notif = {
                type: 'assigned',
                title: 'Task Baru Untukmu! 🎯',
                message: `Kamu di-assign ke: "${task.title}"`,
                taskId: task.id,
                taskTitle: task.title,
            }

            // In-app notification
            addNotif(notif)

            // Browser notification
            sendBrowserNotif(notif.title, notif.message)
        }

        const handleTaskAdded = ({ task }) => {
            if (task.assignee_id !== user.id) return

            const notif = {
                type: 'assigned',
                title: 'Task Baru Untukmu! 🎯',
                message: `Kamu di-assign ke: "${task.title}"`,
                taskId: task.id,
                taskTitle: task.title,
            }

            addNotif(notif)
            sendBrowserNotif(notif.title, notif.message)
        }

        socket.on('task:updated', handleTaskUpdated)
        socket.on('task:added', handleTaskAdded)

        return () => {
            socket.off('task:updated', handleTaskUpdated)
            socket.off('task:added', handleTaskAdded)
        }
    }, [socket, user])
}

// ─── Kirim browser push notification ─────────────────────
function sendBrowserNotif(title, body) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    // Cek apakah tab sedang aktif — kalau aktif, cukup in-app saja
    if (document.visibilityState === 'visible') return

    new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
    })
}

// ─── Check due date tasks ─────────────────────────────────
export function checkDueDateNotifs(tasks, userId, addNotif) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    tasks.forEach(task => {
        if (!task.due_date || task.assignee_id !== userId) return

        const due = new Date(task.due_date)
        due.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
            addNotif({
                type: 'due_urgent',
                title: '⚠️ Deadline Besok!',
                message: `"${task.title}" jatuh tempo besok!`,
                taskId: task.id,
                taskTitle: task.title,
            })
            sendBrowserNotif('⚠️ Deadline Besok!', `"${task.title}" jatuh tempo besok!`)
        } else if (diffDays === 3) {
            addNotif({
                type: 'due_warning',
                title: '📅 Deadline 3 Hari Lagi',
                message: `"${task.title}" jatuh tempo dalam 3 hari`,
                taskId: task.id,
                taskTitle: task.title,
            })
        }
    })
}