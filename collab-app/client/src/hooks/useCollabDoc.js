import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { getSocket } from './useSocket.js'

export function useCollabDoc(roomId) {
  const ydocRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const socket = getSocket()

  useEffect(() => {
    if (!roomId || !socket) return

    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    const onLoaded = ({ update }) => {
      if (update && update.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(update))
      }
      setIsReady(true)
    }

    const onUpdate = ({ update }) => {
      if (update && update.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
      }
    }

    socket.on('doc:loaded', onLoaded)
    socket.on('doc:update', onUpdate)

    const handleDocChange = (update, origin) => {
      if (origin !== 'remote') {
        socket.emit('doc:update', { update: Array.from(update) })
      }
    }
    ydoc.on('update', handleDocChange)

    // Tunggu 300ms agar room:join selesai di server dulu
    // baru kirim doc:get supaya socket.roomId sudah ter-set
    const timer = setTimeout(() => {
      socket.emit('doc:get')
    }, 300)

    return () => {
      clearTimeout(timer)
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