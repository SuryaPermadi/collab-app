import { db } from '../../services/db.js'
import { v4 as uuidv4 } from 'uuid'

export function handleReactions(io, socket) {

    // ─── Toggle reaction (add/remove) ────────────────────
    socket.on('reaction:toggle', async ({ taskId, emoji }) => {
        const roomId = socket.roomId
        if (!roomId || !taskId || !emoji) return

        const userId = socket.user.id

        // Cek apakah sudah ada
        const existing = await db.findOne(
            `SELECT id FROM task_reactions WHERE task_id = $1 AND user_id = $2 AND emoji = $3`,
            [taskId, userId, emoji]
        )

        if (existing) {
            // Hapus reaction
            await db.query(
                `DELETE FROM task_reactions WHERE task_id = $1 AND user_id = $2 AND emoji = $3`,
                [taskId, userId, emoji]
            )
        } else {
            // Tambah reaction
            await db.query(
                `INSERT INTO task_reactions (id, task_id, user_id, emoji) VALUES ($1, $2, $3, $4)
         ON CONFLICT (task_id, user_id, emoji) DO NOTHING`,
                [uuidv4(), taskId, userId, emoji]
            )
        }

        // Ambil semua reactions untuk task ini
        const reactions = await db.findMany(
            `SELECT emoji, user_id, u.name as user_name
       FROM task_reactions tr
       LEFT JOIN users u ON tr.user_id = u.id
       WHERE task_id = $1`,
            [taskId]
        )

        // Group by emoji
        const grouped = reactions.reduce((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] }
            acc[r.emoji].count++
            acc[r.emoji].users.push(r.user_name)
            return acc
        }, {})

        io.to(roomId).emit('reaction:updated', {
            taskId,
            reactions: Object.values(grouped),
        })
    })

    // ─── Get reactions untuk semua tasks di board ─────────
    socket.on('reactions:get', async ({ taskIds }) => {
        if (!taskIds?.length) return

        const rows = await db.findMany(
            `SELECT tr.task_id, tr.emoji, tr.user_id, u.name as user_name
       FROM task_reactions tr
       LEFT JOIN users u ON tr.user_id = u.id
       WHERE tr.task_id = ANY($1)`,
            [taskIds]
        )

        // Group by taskId then emoji
        const byTask = {}
        rows.forEach(r => {
            if (!byTask[r.task_id]) byTask[r.task_id] = {}
            if (!byTask[r.task_id][r.emoji]) byTask[r.task_id][r.emoji] = { emoji: r.emoji, count: 0, users: [] }
            byTask[r.task_id][r.emoji].count++
            byTask[r.task_id][r.emoji].users.push(r.user_name)
        })

        // Convert to { taskId: [reactions] }
        const result = {}
        Object.entries(byTask).forEach(([taskId, emojis]) => {
            result[taskId] = Object.values(emojis)
        })

        socket.emit('reactions:loaded', { reactions: result })
    })
}