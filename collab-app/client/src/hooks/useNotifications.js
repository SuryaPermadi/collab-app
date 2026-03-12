import { useEffect } from 'react'
import { useNotifStore } from '../stores/notifStore.js'
import { useClerkUser } from './useClerkUser.js'
import { getSocket } from './useSocket.js'

export function useNotifications() {
    const { addNotif } = useNotifStore()
    const { user } = useClerkUser()
    const socket = getSocket()

    // Minta izin browser notification
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // Listen event assign + board:loaded untuk due date check
    useEffect(() => {
        if (!socket || !user) return

        // Cek due date otomatis saat board selesai load
        const handleBoardLoaded = ({ tasks }) => {
            checkDueDateNotifs(tasks, user.id, addNotif)
        }

        const handleTaskUpdated = ({ task }) => {
            if (task.assignee_id !== user.id) return

            const notif = {
                type: 'assigned',
                title: 'Task Baru Untukmu! 🎯',
                message: `Kamu di-assign ke: "${task.title}"`,
                taskId: task.id,
            }
            addNotif(notif)
            sendBrowserNotif(notif.title, notif.message)
        }

        const handleTaskAdded = ({ task }) => {
            if (task.assignee_id !== user.id) return
            const notif = {
                type: 'assigned',
                title: 'Task Baru Untukmu! 🎯',
                message: `Kamu di-assign ke: "${task.title}"`,
                taskId: task.id,
            }
            addNotif(notif)
            sendBrowserNotif(notif.title, notif.message)
        }

        socket.on('board:loaded', handleBoardLoaded)
        socket.on('task:updated', handleTaskUpdated)
        socket.on('task:added', handleTaskAdded)

        return () => {
            socket.off('board:loaded', handleBoardLoaded)
            socket.off('task:updated', handleTaskUpdated)
            socket.off('task:added', handleTaskAdded)
        }
    }, [socket, user])
}

function sendBrowserNotif(title, body) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return
    new Notification(title, { body, icon: '/favicon.ico' })
}

export function checkDueDateNotifs(tasks, userId, addNotif) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    tasks.forEach(task => {
        // Tampilkan notif untuk semua task yang di-assign ke user
        // dengan due date dalam 3 hari ke depan (bukan hanya H-1 dan H-3 persis)
        if (!task.due_date || task.assignee_id !== userId) return

        const due = new Date(task.due_date)
        due.setHours(0, 0, 0, 0)
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

        if (diff < 0) {
            addNotif({
                type: 'due_urgent',
                title: '🔴 Task Overdue!',
                message: `"${task.title}" sudah melewati deadline!`,
                taskId: task.id,
            })
        } else if (diff === 0) {
            addNotif({
                type: 'due_urgent',
                title: '⚠️ Deadline Hari Ini!',
                message: `"${task.title}" harus selesai hari ini!`,
                taskId: task.id,
            })
            sendBrowserNotif('⚠️ Deadline Hari Ini!', `"${task.title}" harus selesai hari ini!`)
        } else if (diff <= 3) {
            addNotif({
                type: 'due_warning',
                title: `📅 Deadline ${diff === 1 ? 'Besok' : `${diff} Hari Lagi`}`,
                message: `"${task.title}" jatuh tempo ${diff === 1 ? 'besok' : `dalam ${diff} hari`}`,
                taskId: task.id,
            })
        }
    })
}