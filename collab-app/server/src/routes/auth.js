import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../services/db.js'

const router = Router()

// ─── POST /api/auth/register ──────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' })
    }

    // Cek email sudah terdaftar
    const existing = await db.findOne('SELECT id FROM users WHERE email = $1', [email])
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const avatarColor = randomColor()

    const user = await db.findOne(
      `INSERT INTO users (name, email, password, avatar_color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar_color`,
      [name, email, hashedPassword, avatarColor]
    )

    const token = signToken(user.id)

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatar_color,
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' })
    }

    const user = await db.findOne('SELECT * FROM users WHERE email = $1', [email])
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }

    const token = signToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatar_color,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const user = await db.findOne(
      'SELECT id, name, email, avatar_color FROM users WHERE id = $1',
      [payload.userId]
    )

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatar_color,
    })
  } catch {
    res.status(401).json({ error: 'Token tidak valid' })
  }
})

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function randomColor() {
  const colors = ['#00E5C3', '#FF4D6D', '#7B61FF', '#FFB347', '#4FC3F7', '#81C784']
  return colors[Math.floor(Math.random() * colors.length)]
}

export default router
