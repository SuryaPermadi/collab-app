import { db } from '../../services/db.js'

export function handleCanvas(io, socket) {
  // ─── Client minta semua shapes saat join ──────────────
  socket.on('canvas:get', async () => {
    const roomId = socket.roomId
    if (!roomId) return

    const shapes = await db.findMany(
      `SELECT * FROM canvas_shapes WHERE room_id = $1 ORDER BY z_index ASC`,
      [roomId]
    )

    socket.emit('canvas:loaded', { shapes })
  })

  // ─── Tambah shape baru ────────────────────────────────
  socket.on('shape:add', async ({ shape }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      const saved = await db.findOne(
        `INSERT INTO canvas_shapes (id, room_id, type, props, z_index, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          shape.id,
          roomId,
          shape.type,
          JSON.stringify(shape.props),
          shape.zIndex || 0,
          socket.user.isGuest ? null : socket.user.id,
        ]
      )

      // Broadcast ke semua user di room (termasuk pengirim untuk konfirmasi)
      io.to(roomId).emit('shape:added', { shape: saved })
    } catch (err) {
      console.error('Shape add error:', err.message)
      socket.emit('shape:error', { message: 'Gagal menambah shape' })
    }
  })

  // ─── Update shape (drag/resize) ───────────────────────
  socket.on('shape:update', async ({ id, props }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      await db.query(
        `UPDATE canvas_shapes
         SET props = props || $1::jsonb, updated_at = NOW()
         WHERE id = $2 AND room_id = $3`,
        [JSON.stringify(props), id, roomId]
      )

      // Broadcast ke user lain (bukan pengirim, karena pengirim sudah update lokal)
      socket.to(roomId).emit('shape:updated', { id, props })
    } catch (err) {
      console.error('Shape update error:', err.message)
    }
  })

  // ─── Hapus shape ──────────────────────────────────────
  socket.on('shape:delete', async ({ id }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      await db.query(
        'DELETE FROM canvas_shapes WHERE id = $1 AND room_id = $2',
        [id, roomId]
      )

      io.to(roomId).emit('shape:deleted', { id })
    } catch (err) {
      console.error('Shape delete error:', err.message)
    }
  })

  // ─── Live cursor di canvas ────────────────────────────
  socket.on('canvas:cursor', ({ x, y }) => {
    const roomId = socket.roomId
    if (!roomId) return

    socket.to(roomId).emit('canvas:cursor', {
      userId: socket.user.id,
      name: socket.user.name,
      avatarColor: socket.user.avatarColor,
      x, y,
    })
  })

  // ─── User sedang drag shape (untuk live preview) ──────
  socket.on('shape:dragging', ({ id, x, y }) => {
    socket.to(socket.roomId).emit('shape:dragging', {
      userId: socket.user.id,
      id, x, y,
    })
  })
}
