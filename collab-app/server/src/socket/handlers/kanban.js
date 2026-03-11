import { db } from '../../services/db.js'
import { v4 as uuidv4 } from 'uuid'

// Default columns saat room baru dibuat
const DEFAULT_COLUMNS = [
  { title: '📋 Backlog', color: '#5A6380', position: 0 },
  { title: '🔄 In Progress', color: '#7B61FF', position: 1 },
  { title: '👀 Review', color: '#FFB347', position: 2 },
  { title: '✅ Done', color: '#00E5C3', position: 3 },
]

export async function ensureDefaultColumns(roomId) {
  const existing = await db.findMany(
    'SELECT id FROM board_columns WHERE room_id = $1',
    [roomId]
  )
  if (existing.length > 0) return

  for (const col of DEFAULT_COLUMNS) {
    await db.query(
      `INSERT INTO board_columns (id, room_id, title, color, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), roomId, col.title, col.color, col.position]
    )
  }
}

async function logActivity(roomId, userId, userName, action) {
  await db.query(
    `INSERT INTO activity_logs (room_id, user_id, user_name, action)
     VALUES ($1, $2, $3, $4)`,
    [roomId, userId, userName, action]
  )
}

export function handleKanban(io, socket) {

  // ─── GET board (columns + tasks) ─────────────────────
  socket.on('board:get', async () => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      await ensureDefaultColumns(roomId)

      const columns = await db.findMany(
        `SELECT * FROM board_columns WHERE room_id = $1 ORDER BY position ASC`,
        [roomId]
      )

      const tasks = await db.findMany(
        `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         WHERE t.room_id = $1
         ORDER BY t.position ASC`,
        [roomId]
      )

      const logs = await db.findMany(
        `SELECT * FROM activity_logs WHERE room_id = $1
         ORDER BY created_at DESC LIMIT 20`,
        [roomId]
      )

      socket.emit('board:loaded', { columns, tasks, logs })
    } catch (err) {
      console.error('board:get error:', err.message)
    }
  })

  // ─── ADD column ───────────────────────────────────────
  socket.on('column:add', async ({ title, color }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      const maxPos = await db.findOne(
        'SELECT COALESCE(MAX(position), -1) as max FROM board_columns WHERE room_id = $1',
        [roomId]
      )

      const column = await db.findOne(
        `INSERT INTO board_columns (id, room_id, title, color, position)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [uuidv4(), roomId, title, color || '#1E2433', (maxPos?.max ?? -1) + 1]
      )

      io.to(roomId).emit('column:added', { column })
    } catch (err) {
      console.error('column:add error:', err.message)
    }
  })

  // ─── UPDATE column ────────────────────────────────────
  socket.on('column:update', async ({ id, title, color }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      const column = await db.findOne(
        `UPDATE board_columns SET title = COALESCE($1, title), color = COALESCE($2, color)
         WHERE id = $3 AND room_id = $4 RETURNING *`,
        [title, color, id, roomId]
      )
      io.to(roomId).emit('column:updated', { column })
    } catch (err) {
      console.error('column:update error:', err.message)
    }
  })

  // ─── DELETE column ────────────────────────────────────
  socket.on('column:delete', async ({ id }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      await db.query(
        'DELETE FROM board_columns WHERE id = $1 AND room_id = $2',
        [id, roomId]
      )
      io.to(roomId).emit('column:deleted', { id })
    } catch (err) {
      console.error('column:delete error:', err.message)
    }
  })

  // ─── ADD task ─────────────────────────────────────────
  socket.on('task:add', async ({ columnId, title, priority }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      const maxPos = await db.findOne(
        'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE column_id = $1',
        [columnId]
      )

      const task = await db.findOne(
        `INSERT INTO tasks (id, room_id, column_id, title, priority, position, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          uuidv4(), roomId, columnId, title,
          priority || 'medium',
          (maxPos?.max ?? -1) + 1,
          socket.user.isGuest ? null : socket.user.id
        ]
      )

      await logActivity(roomId, socket.user.id, socket.user.name,
        `menambahkan task "${title}"`)

      io.to(roomId).emit('task:added', { task })
      io.to(roomId).emit('activity:new', {
        id: uuidv4(),
        user_name: socket.user.name,
        action: `menambahkan task "${title}"`,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('task:add error:', err.message)
    }
  })

  // ─── UPDATE task ──────────────────────────────────────
  socket.on('task:update', async ({ id, updates }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      const fields = []
      const values = []
      let i = 1

      const allowed = ['title', 'description', 'priority', 'assignee_id', 'due_date', 'labels']
      for (const key of allowed) {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${i++}`)
          values.push(updates[key])
        }
      }

      if (fields.length === 0) return

      fields.push(`updated_at = NOW()`)
      values.push(id, roomId)

      const task = await db.findOne(
        `UPDATE tasks SET ${fields.join(', ')}
         WHERE id = $${i} AND room_id = $${i + 1}
         RETURNING *`,
        values
      )

      // Fetch with assignee name
      const taskWithAssignee = await db.findOne(
        `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         WHERE t.id = $1`,
        [task.id]
      )

      io.to(roomId).emit('task:updated', { task: taskWithAssignee })
    } catch (err) {
      console.error('task:update error:', err.message)
    }
  })

  // ─── MOVE task (drag & drop antar kolom) ─────────────
  socket.on('task:move', async ({ taskId, toColumnId, newPosition }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      // Ambil info task sebelum dipindah (untuk activity log)
      const oldTask = await db.findOne('SELECT * FROM tasks WHERE id = $1', [taskId])
      const newCol = await db.findOne('SELECT title FROM board_columns WHERE id = $1', [toColumnId])

      // Update posisi task-task lain di kolom tujuan
      await db.query(
        `UPDATE tasks SET position = position + 1
         WHERE column_id = $1 AND position >= $2 AND room_id = $3`,
        [toColumnId, newPosition, roomId]
      )

      const task = await db.findOne(
        `UPDATE tasks
         SET column_id = $1, position = $2, updated_at = NOW()
         WHERE id = $3 AND room_id = $4
         RETURNING *`,
        [toColumnId, newPosition, taskId, roomId]
      )

      // Log activity kalau pindah kolom
      if (oldTask && oldTask.column_id !== toColumnId) {
        const oldCol = await db.findOne(
          'SELECT title FROM board_columns WHERE id = $1', [oldTask.column_id]
        )
        const action = `memindahkan "${oldTask.title}" ke ${newCol?.title || 'kolom baru'}`
        await logActivity(roomId, socket.user.id, socket.user.name, action)

        io.to(roomId).emit('activity:new', {
          id: uuidv4(),
          user_name: socket.user.name,
          action,
          created_at: new Date().toISOString(),
        })
      }

      io.to(roomId).emit('task:moved', { task })
    } catch (err) {
      console.error('task:move error:', err.message)
    }
  })

  // ─── DELETE task ──────────────────────────────────────
  socket.on('task:delete', async ({ id }) => {
    const roomId = socket.roomId
    if (!roomId) return

    try {
      const task = await db.findOne('SELECT title FROM tasks WHERE id = $1', [id])
      await db.query('DELETE FROM tasks WHERE id = $1 AND room_id = $2', [id, roomId])

      const action = `menghapus task "${task?.title}"`
      await logActivity(roomId, socket.user.id, socket.user.name, action)

      io.to(roomId).emit('task:deleted', { id })
      io.to(roomId).emit('activity:new', {
        id: uuidv4(),
        user_name: socket.user.name,
        action,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('task:delete error:', err.message)
    }
  })

  // ─── GET subtasks ─────────────────────────────────────
  socket.on('subtask:get', async ({ taskId }) => {
    try {
      const subtasks = await db.findMany(
        'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY position ASC',
        [taskId]
      )
      socket.emit('subtask:loaded', { taskId, subtasks })
    } catch (err) {
      console.error('subtask:get error:', err.message)
    }
  })

  // ─── ADD subtask ──────────────────────────────────────
  socket.on('subtask:add', async ({ taskId, title }) => {
    const roomId = socket.roomId
    if (!roomId) return
    try {
      const maxPos = await db.findOne(
        'SELECT COALESCE(MAX(position), -1) as max FROM subtasks WHERE task_id = $1',
        [taskId]
      )
      const subtask = await db.findOne(
        `INSERT INTO subtasks (id, task_id, title, position)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [uuidv4(), taskId, title, (maxPos?.max ?? -1) + 1]
      )
      io.to(roomId).emit('subtask:added', { taskId, subtask })
    } catch (err) {
      console.error('subtask:add error:', err.message)
    }
  })

  // ─── TOGGLE subtask ───────────────────────────────────
  socket.on('subtask:toggle', async ({ id, taskId }) => {
    const roomId = socket.roomId
    if (!roomId) return
    try {
      const subtask = await db.findOne(
        'UPDATE subtasks SET done = NOT done WHERE id = $1 RETURNING *',
        [id]
      )
      io.to(roomId).emit('subtask:toggled', { taskId, subtask })
    } catch (err) {
      console.error('subtask:toggle error:', err.message)
    }
  })

  // ─── DELETE subtask ───────────────────────────────────
  socket.on('subtask:delete', async ({ id, taskId }) => {
    const roomId = socket.roomId
    if (!roomId) return
    try {
      await db.query('DELETE FROM subtasks WHERE id = $1', [id])
      io.to(roomId).emit('subtask:deleted', { taskId, id })
    } catch (err) {
      console.error('subtask:delete error:', err.message)
    }
  })
}