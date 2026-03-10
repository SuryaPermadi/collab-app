import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore, useRoomStore } from '../stores/index.js'

let socketInstance = null

export function useSocket() {
  const token = useAuthStore(s => s.token)
  const user = useAuthStore(s => s.user)
  const { setOnlineUsers, addUser, removeUser, updateCursor } = useRoomStore()
  const initialized = useRef(false)

  // Inisialisasi socket sekali saja
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    socketInstance = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: token
        ? { token }
        : { guestName: `Guest_${Math.floor(Math.random() * 1000)}` },
      transports: ['websocket', 'polling'], // tambah polling sebagai fallback
      autoConnect: true,
    })

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id)
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    socketInstance.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    // ─── Presence Events ────────────────────────────────
    socketInstance.on('room:state', ({ users }) => {
      setOnlineUsers(users)
    })

    socketInstance.on('user:joined', (userData) => {
      addUser(userData)
    })

    socketInstance.on('user:left', ({ id }) => {
      removeUser(id)
    })

    socketInstance.on('cursor:moved', ({ userId, name, avatarColor, x, y }) => {
      updateCursor(userId, { name, avatarColor, x, y })
    })

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
        initialized.current = false
      }
    }
  }, [])

  const joinRoom = useCallback((roomId) => {
    socketInstance?.emit('room:join', { roomId })
  }, [])

  const emit = useCallback((event, data) => {
    socketInstance?.emit(event, data)
  }, [])

  const on = useCallback((event, handler) => {
    socketInstance?.on(event, handler)
    return () => socketInstance?.off(event, handler)
  }, [])

  const off = useCallback((event, handler) => {
    socketInstance?.off(event, handler)
  }, [])

  return { socket: socketInstance, joinRoom, emit, on, off }
}

// Export socket instance untuk dipakai di luar hook
export function getSocket() {
  return socketInstance
}
