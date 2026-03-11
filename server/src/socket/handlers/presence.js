import { presence } from '../../services/redis.js'

export function handlePresence(io, socket) {
  // ─── Update posisi cursor di editor ──────────────────
  socket.on('cursor:move', ({ x, y, page }) => {
    const roomId = socket.roomId
    if (!roomId) return

    // Broadcast ke semua user di room KECUALI pengirim
    socket.to(roomId).emit('cursor:moved', {
      userId: socket.user.id,
      name: socket.user.name,
      avatarColor: socket.user.avatarColor,
      x, y, page,
    })
  })

  // ─── Update focus user (editor/canvas) ───────────────
  socket.on('user:focus', async ({ focus }) => {
    const roomId = socket.roomId
    if (!roomId) return

    const users = await presence.getAll(roomId)
    const me = users.find(u => u.id === socket.user.id)
    if (me) {
      await presence.update(roomId, socket.user.id, { ...me, focus })
    }

    socket.to(roomId).emit('user:focused', {
      userId: socket.user.id,
      focus,
    })
  })

  // ─── Ping: keep presence alive ────────────────────────
  socket.on('presence:ping', async () => {
    const roomId = socket.roomId
    if (!roomId) return

    const users = await presence.getAll(roomId)
    const me = users.find(u => u.id === socket.user.id)
    if (me) {
      await presence.update(roomId, socket.user.id, {
        ...me,
        lastSeen: Date.now(),
      })
    }
  })
}
