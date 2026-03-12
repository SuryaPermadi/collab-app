import { Router } from 'express'
import { randomBytes } from 'crypto'
import { db } from '../services/db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// ─── POST /api/rooms — Buat room baru ────────────────────
router.post('/', authRequired, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nama room wajib diisi' })

    const inviteCode = randomBytes(4).toString('hex').toUpperCase()

    const room = await db.findOne(
      `INSERT INTO rooms (name, owner_id, invite_code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, req.user.id, inviteCode]
    )

    // Buat dokumen kosong untuk room ini
    await db.query(
      `INSERT INTO documents (room_id) VALUES ($1)`,
      [room.id]
    )

    // Owner otomatis jadi member
    await db.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [room.id, req.user.id]
    )

    res.status(201).json(room)
  } catch (err) {
    console.error('Create room error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /api/rooms — List room milik user ───────────────
router.get('/', authRequired, async (req, res) => {
  try {
    const rooms = await db.findMany(
      `SELECT r.*, rm.role,
              (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
       FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    )
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /api/rooms/:id — Detail room ────────────────────
router.get('/:id', async (req, res) => {
  try {
    const room = await db.findOne(
      `SELECT r.*,
              u.name as owner_name,
              u.avatar_color as owner_color
       FROM rooms r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = $1`,
      [req.params.id]
    )

    if (!room) return res.status(404).json({ error: 'Room tidak ditemukan' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── POST /api/rooms/join — Join via invite code ─────────
router.post('/join', authRequired, async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) return res.status(400).json({ error: 'Invite code wajib diisi' })

    const room = await db.findOne(
      'SELECT * FROM rooms WHERE invite_code = $1',
      [inviteCode.toUpperCase()]
    )

    if (!room) return res.status(404).json({ error: 'Invite code tidak valid' })

    // Cek sudah member atau belum
    const existing = await db.findOne(
      'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
      [room.id, req.user.id]
    )

    if (!existing) {
      await db.query(
        `INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, 'editor')`,
        [room.id, req.user.id]
      )
    }

    res.json(room)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /api/rooms/:id/members — Daftar member room ─────
router.get('/:id/members', async (req, res) => {
  try {
    const members = await db.findMany(
      `SELECT u.id, u.name, u.avatar_color, rm.role
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1
       ORDER BY rm.role DESC, u.name ASC`,
      [req.params.id]
    )
    res.json(members)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── DELETE /api/rooms/:id — Hapus room ──────────────────
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const room = await db.findOne(
      'SELECT * FROM rooms WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    )

    if (!room) return res.status(403).json({ error: 'Forbidden' })

    await db.query('DELETE FROM rooms WHERE id = $1', [req.params.id])
    res.json({ message: 'Room berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router