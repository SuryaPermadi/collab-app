import Redis from 'ioredis'

let redis

export async function connectRedis() {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  })

  redis.on('error', (err) => console.error('Redis error:', err.message))

  await redis.connect()
  console.log('✅ Redis connected')
}

export function getRedis() {
  return redis
}

// ─── Presence Helpers ─────────────────────────────────────
// Menyimpan siapa saja yang online di sebuah room

export const presence = {
  // Tambah user ke room
  async join(roomId, userId, userData) {
    const key = `presence:${roomId}`
    await redis.hset(key, userId, JSON.stringify(userData))
    await redis.expire(key, 3600) // expire 1 jam
  },

  // Hapus user dari room
  async leave(roomId, userId) {
    await redis.hdel(`presence:${roomId}`, userId)
  },

  // Ambil semua user yang online di room
  async getAll(roomId) {
    const data = await redis.hgetall(`presence:${roomId}`)
    if (!data) return []
    return Object.values(data).map(v => JSON.parse(v))
  },

  // Update data user (misal: posisi cursor)
  async update(roomId, userId, userData) {
    const key = `presence:${roomId}`
    const exists = await redis.hexists(key, userId)
    if (exists) {
      await redis.hset(key, userId, JSON.stringify(userData))
    }
  },
}

// ─── Room State Helpers ───────────────────────────────────
export const roomState = {
  async setYjsState(roomId, state) {
    // Simpan state Yjs document di Redis sebagai buffer sementara
    await redis.set(`yjs:${roomId}`, Buffer.from(state), 'EX', 86400)
  },

  async getYjsState(roomId) {
    const data = await redis.getBuffer(`yjs:${roomId}`)
    return data
  },
}
