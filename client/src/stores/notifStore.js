import { create } from 'zustand'

export const useNotifStore = create((set) => ({
    notifs: [],
    unreadCount: 0,

    addNotif: (notif) => set((state) => ({
        notifs: [{ ...notif, id: Date.now(), read: false, createdAt: new Date() }, ...state.notifs].slice(0, 50),
        unreadCount: state.unreadCount + 1,
    })),

    markAllRead: () => set((state) => ({
        notifs: state.notifs.map(n => ({ ...n, read: true })),
        unreadCount: 0,
    })),

    markRead: (id) => set((state) => ({
        notifs: state.notifs.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
    })),

    clearAll: () => set({ notifs: [], unreadCount: 0 }),
}))