import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api.js'

// ─── Auth Store ───────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ user: data.user, token: data.token, isLoading: false })
          api.defaults.headers.Authorization = `Bearer ${data.token}`
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.error || 'Login gagal' }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          set({ user: data.user, token: data.token, isLoading: false })
          api.defaults.headers.Authorization = `Bearer ${data.token}`
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.error || 'Registrasi gagal' }
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.Authorization
      },

      initToken: () => {
        const token = get().token
        if (token) {
          api.defaults.headers.Authorization = `Bearer ${token}`
        }
      },
    }),
    {
      name: 'collab-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

// ─── Room Store ───────────────────────────────────────────
export const useRoomStore = create((set) => ({
  currentRoom: null,
  onlineUsers: [],
  cursors: {},       // { userId: { x, y, name, avatarColor } }
  activeTab: 'editor', // 'editor' | 'canvas'

  setRoom: (room) => set({ currentRoom: room }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addUser: (user) =>
    set((state) => ({
      onlineUsers: [...state.onlineUsers.filter(u => u.id !== user.id), user],
    })),

  removeUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter(u => u.id !== userId),
      cursors: Object.fromEntries(
        Object.entries(state.cursors).filter(([id]) => id !== userId)
      ),
    })),

  updateCursor: (userId, cursorData) =>
    set((state) => ({
      cursors: { ...state.cursors, [userId]: cursorData },
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),
}))
