import { db } from '../../services/db.js'
import { v4 as uuidv4 } from 'uuid'

export function handleChat(io, socket) {

    // ─── Get chat history ─────────────────────────────────
    socket.on('chat:get', async () => {
        const roomId = socket.roomId
        if (!roomId) return

        const messages = await db.findMany(
            `SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT 100`,
            [roomId]
        )
        socket.emit('chat:loaded', { messages })
    })

    // ─── Send message ─────────────────────────────────────
    socket.on('chat:send', async ({ content }) => {
        const roomId = socket.roomId
        if (!roomId || !content?.trim()) return

        const msg = await db.findOne(
            `INSERT INTO messages (id, room_id, user_id, user_name, avatar_color, content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                uuidv4(), roomId,
                socket.user.isGuest ? null : socket.user.id,
                socket.user.name,
                socket.user.avatarColor || '#00E5C3',
                content.trim(),
            ]
        )

        io.to(roomId).emit('chat:message', msg)
    })

    // ─── Typing indicator ─────────────────────────────────
    socket.on('chat:typing', ({ isTyping }) => {
        const roomId = socket.roomId
        if (!roomId) return
        socket.to(roomId).emit('chat:typing', {
            userId: socket.user.id,
            name: socket.user.name,
            isTyping,
        })
    })
}