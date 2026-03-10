import { socketAuth } from '../middleware/auth.js'
import { handlePresence } from './handlers/presence.js'
import { handleDocument } from './handlers/document.js'
import { handleCanvas } from './handlers/canvas.js'
import { presence } from '../services/redis.js'

export function initSocket(io) {
  // ─── Autentikasi setiap koneksi WebSocket ──────────────
  io.use(socketAuth)

  io.on('connection', async (socket) => {
    console.log(`🔌 Connected: ${socket.user.name} (${socket.id})`)

    // ─── JOIN ROOM ────────────────────────────────────────
    // Client wajib emit 'room:join' setelah connect
    socket.on('room:join', async ({ roomId }) => {
      if (!roomId) return

      socket.roomId = roomId
      socket.join(roomId)

      // Simpan presence ke Redis
      const userData = {
        id: socket.user.id,
        socketId: socket.id,
        name: socket.user.name,
        avatarColor: socket.user.avatarColor,
        isGuest: socket.user.isGuest,
        joinedAt: Date.now(),
        focus: 'editor', // 'editor' | 'canvas'
      }

      await presence.join(roomId, socket.user.id, userData)

      // Kirim state awal ke user yang baru join
      const onlineUsers = await presence.getAll(roomId)
      socket.emit('room:state', { users: onlineUsers })

      // Beritahu user lain ada yang join
      socket.to(roomId).emit('user:joined', userData)

      console.log(`📥 ${socket.user.name} joined room ${roomId}`)
    })

    // ─── Register handlers ────────────────────────────────
    handlePresence(io, socket)
    handleDocument(io, socket)
    handleCanvas(io, socket)

    // ─── DISCONNECT ───────────────────────────────────────
    socket.on('disconnect', async () => {
      const roomId = socket.roomId
      if (roomId) {
        await presence.leave(roomId, socket.user.id)
        io.to(roomId).emit('user:left', { id: socket.user.id })
        console.log(`📤 ${socket.user.name} left room ${roomId}`)
      }
    })
  })
}
