import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { getSocket } from './useSocket.js'

export function useCollabDoc(roomId) {
  const ydocRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const socket = getSocket()

  useEffect(() => {
    if (!roomId || !socket) return

    // Buat Yjs document baru
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    // ─── Minta state dokumen dari server ──────────────
    socket.emit('doc:get')

    // ─── Terima state awal dari server ────────────────
    const onLoaded = ({ update }) => {
      const updateBuffer = new Uint8Array(update)
      Y.applyUpdate(ydoc, updateBuffer)
      setIsReady(true)
    }

    // ─── Terima update dari user lain ─────────────────
    const onUpdate = ({ update }) => {
      const updateBuffer = new Uint8Array(update)
      Y.applyUpdate(ydoc, updateBuffer)
    }

    socket.on('doc:loaded', onLoaded)
    socket.on('doc:update', onUpdate)

    // ─── Kirim update ke server saat dokumen berubah ──
    const handleDocChange = (update, origin) => {
      // Hanya kirim jika perubahan bukan dari socket (origin bukan 'remote')
      if (origin !== 'remote') {
        socket.emit('doc:update', {
          update: Array.from(update),
        })
      }
    }

    ydoc.on('update', handleDocChange)

    return () => {
      socket.off('doc:loaded', onLoaded)
      socket.off('doc:update', onUpdate)
      ydoc.off('update', handleDocChange)
      ydoc.destroy()
      ydocRef.current = null
      setIsReady(false)
    }
  }, [roomId, socket])

  return { ydoc: ydocRef.current, isReady }
}
