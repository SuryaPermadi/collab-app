import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useRoomStore } from '../stores/index.js'

let socketInstance = null

export function useSocket() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const { setOnlineUsers, addUser, removeUser, updateCursor } = useRoomStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current || !user) return
    initialized.current = true

    const initSocket = async () => {
      const token = await getToken()

      socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
        auth: { token },
        transports: ['websocket'],
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

      socketInstance.on('room:state', ({ users }) => setOnlineUsers(users))
      socketInstance.on('user:joined', (userData) => addUser(userData))
      socketInstance.on('user:left', ({ id }) => removeUser(id))
      socketInstance.on('cursor:moved', ({ userId, name, avatarColor, x, y }) => {
        updateCursor(userId, { name, avatarColor, x, y })
      })
      socketInstance.on('canvas:cursor:moved', ({ userId, name, avatarColor, x, y }) => {
        updateCursor(userId, { name, avatarColor, x, y })
      })
    }

    initSocket()

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
        initialized.current = false
      }
    }
  }, [user])

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

export function getSocket() {
  return socketInstance
}