import * as Y from 'yjs'
import { db } from '../../services/db.js'
import { roomState } from '../../services/redis.js'

// In-memory Yjs docs per room (untuk performance)
// Di production: bisa pindah ke Redis atau dedicated Yjs server
const yjsDocs = new Map()

function getOrCreateYDoc(roomId) {
  if (!yjsDocs.has(roomId)) {
    yjsDocs.set(roomId, new Y.Doc())
  }
  return yjsDocs.get(roomId)
}

export function handleDocument(io, socket) {
  // ─── Client minta state dokumen saat pertama join ─────
  socket.on('doc:get', async () => {
    const roomId = socket.roomId
    if (!roomId) return

    const doc = getOrCreateYDoc(roomId)

    // Cek apakah doc masih kosong, kalau iya load dari DB
    if (doc.store.clients.size === 0) {
      const saved = await db.findOne(
        'SELECT content FROM documents WHERE room_id = $1',
        [roomId]
      )

      if (saved?.content) {
        Y.applyUpdate(doc, saved.content)
      }
    }

    // Kirim state lengkap ke client yang baru join
    const state = Y.encodeStateAsUpdate(doc)
    socket.emit('doc:loaded', { update: Array.from(state) })
  })

  // ─── Client kirim update (user mengetik) ──────────────
  // update adalah Yjs binary update dalam bentuk number array
  socket.on('doc:update', async ({ update }) => {
    const roomId = socket.roomId
    if (!roomId) return

    const doc = getOrCreateYDoc(roomId)
    const updateBuffer = new Uint8Array(update)

    // Apply update ke server doc (merge CRDT)
    Y.applyUpdate(doc, updateBuffer)

    // Broadcast update ke semua user lain di room
    socket.to(roomId).emit('doc:update', { update })

    // Auto-save ke DB setiap update (dengan debounce di bawah)
    scheduleSave(roomId, doc)
  })

  // ─── Awareness: posisi cursor di dalam editor ─────────
  // (berbeda dengan cursor mouse, ini adalah caret position di teks)
  socket.on('doc:awareness', ({ states }) => {
    const roomId = socket.roomId
    if (!roomId) return

    socket.to(roomId).emit('doc:awareness', {
      userId: socket.user.id,
      states,
    })
  })
}

// ─── Debounced save ke PostgreSQL ─────────────────────────
// Mencegah terlalu banyak write ke DB saat user mengetik cepat
const saveTimers = new Map()

function scheduleSave(roomId, doc) {
  if (saveTimers.has(roomId)) {
    clearTimeout(saveTimers.get(roomId))
  }

  const timer = setTimeout(async () => {
    try {
      const state = Y.encodeStateAsUpdate(doc)
      const buffer = Buffer.from(state)

      // Ambil plaintext untuk keperluan search
      const ytext = doc.getText('content')
      const plaintext = ytext.toString().slice(0, 5000) // limit

      await db.query(
        `UPDATE documents
         SET content = $1, content_text = $2, updated_at = NOW()
         WHERE room_id = $3`,
        [buffer, plaintext, roomId]
      )

      console.log(`💾 Doc saved for room ${roomId}`)
    } catch (err) {
      console.error('Save doc error:', err.message)
    }

    saveTimers.delete(roomId)
  }, 2000) // simpan 2 detik setelah ketikan berhenti

  saveTimers.set(roomId, timer)
}
