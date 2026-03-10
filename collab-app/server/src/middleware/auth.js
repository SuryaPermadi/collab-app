import jwt from 'jsonwebtoken'
import { db } from '../services/db.js'

// ─── REST middleware ──────────────────────────────────────
export function authRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah expired' })
  }
}

// ─── Socket.io middleware ─────────────────────────────────
// Verifikasi token saat WebSocket handshake
export async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token

    // Guest mode: tidak perlu token, cukup nama
    if (!token) {
      const guestName = socket.handshake.auth?.guestName
      if (!guestName) {
        return next(new Error('Token atau nama guest wajib diisi'))
      }

      socket.user = {
        id: `guest_${socket.id}`,
        name: guestName,
        isGuest: true,
        avatarColor: randomColor(),
      }
      return next()
    }

    // Authenticated user
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await db.findOne(
      'SELECT id, name, email, avatar_color FROM users WHERE id = $1',
      [payload.userId]
    )

    if (!user) return next(new Error('User tidak ditemukan'))

    socket.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatar_color,
      isGuest: false,
    }

    next()
  } catch (err) {
    next(new Error('Autentikasi gagal: ' + err.message))
  }
}

function randomColor() {
  const colors = ['#00E5C3', '#FF4D6D', '#7B61FF', '#FFB347', '#4FC3F7', '#81C784']
  return colors[Math.floor(Math.random() * colors.length)]
}
