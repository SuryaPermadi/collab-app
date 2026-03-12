import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

function randomColor() {
  const colors = ['#00E5C3', '#FF4D6D', '#7B61FF', '#FFB347', '#4FC3F7', '#81C784']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Decode JWT tanpa verify (Clerk sudah verify di frontend)
// Untuk production gunakan authenticateRequest dari @clerk/backend
function decodeJwt(token) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }
  return payload
}

// ─── REST middleware ──────────────────────────────────────
export async function authRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }

  try {
    const token = header.split(' ')[1]
    const payload = decodeJwt(token)
    req.user = { id: payload.sub }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid: ' + err.message })
  }
}

// ─── Socket.io middleware ─────────────────────────────────
export async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Token wajib diisi'))

    const payload = decodeJwt(token)
    const clerkUser = await clerk.users.getUser(payload.sub)

    const name = clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
      : clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'

    socket.user = {
      id: payload.sub,
      name,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      avatarColor: randomColor(),
      imageUrl: clerkUser.imageUrl,
      isGuest: false,
    }

    next()
  } catch (err) {
    next(new Error('Autentikasi gagal: ' + err.message))
  }
}