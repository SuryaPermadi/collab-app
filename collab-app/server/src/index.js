import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import { connectDB } from './services/db.js'
import { connectRedis } from './services/redis.js'
import { initSocket } from './socket/index.js'

import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'

const app = express()
const httpServer = createServer(app)

// ─── Socket.io Setup ─────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ─── REST Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Socket.io Events ────────────────────────────────────
initSocket(io)

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 3001

async function main() {
  await connectDB()
  await connectRedis()

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
    console.log(`🔌 WebSocket ready`)
  })
}

main().catch(console.error)
