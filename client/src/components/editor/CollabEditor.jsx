import { useEffect, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import * as Y from 'yjs'
import { getSocket } from '../../hooks/useSocket.js'
import { useAuthStore } from '../../stores/index.js'
import EditorToolbar from './EditorToolbar.jsx'

// Custom Yjs WebSocket Provider yang pakai Socket.io
class SocketIOProvider {
  constructor(ydoc, socket, roomId) {
    this.ydoc = ydoc
    this.socket = socket
    this.roomId = roomId
    this.awareness = new (require('y-protocols/awareness').Awareness ?? FakeAwareness)(ydoc)

    // Minta state dokumen dari server
    socket.emit('doc:get')

    // Terima state awal
    socket.on('doc:loaded', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
    })

    // Terima update dari user lain
    socket.on('doc:update', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
    })

    // Kirim perubahan ke server
    this.ydoc.on('update', (update, origin) => {
      if (origin !== 'remote') {
        socket.emit('doc:update', { update: Array.from(update) })
      }
    })
  }

  destroy() {
    this.socket.off('doc:loaded')
    this.socket.off('doc:update')
  }
}

export default function CollabEditor({ roomId }) {
  const user = useAuthStore(s => s.user)
  const socket = getSocket()
  const ydocRef = useRef(null)
  const providerRef = useRef(null)

  // Buat Yjs doc dan sync dengan socket
  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc()
    ydocRef.current = doc

    if (socket) {
      // Minta state dari server
      socket.emit('doc:get')

      socket.on('doc:loaded', ({ update }) => {
        Y.applyUpdate(doc, new Uint8Array(update), 'remote')
      })

      socket.on('doc:update', ({ update }) => {
        Y.applyUpdate(doc, new Uint8Array(update), 'remote')
      })

      doc.on('update', (update, origin) => {
        if (origin !== 'remote') {
          socket.emit('doc:update', { update: Array.from(update) })
        }
      })
    }

    return { ydoc: doc, provider: null }
  }, [roomId])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history karena Yjs yang handle undo/redo
        history: false,
      }),
      Collaboration.configure({ document: ydoc }),
      Placeholder.configure({
        placeholder: 'Mulai menulis... semua perubahan tersimpan otomatis dan terlihat oleh semua kolaborator.',
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 100%; padding: 60px 80px; max-width: 860px; margin: 0 auto;',
      },
    },
  })

  useEffect(() => {
    return () => {
      ydocRef.current?.destroy()
      if (socket) {
        socket.off('doc:loaded')
        socket.off('doc:update')
      }
    }
  }, [])

  if (!editor) return null

  return (
    <div style={styles.wrap}>
      <EditorToolbar editor={editor} />
      <div style={styles.editorArea}>
        <EditorContent editor={editor} style={styles.editorContent} />
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#080A0F',
  },
  editorArea: {
    flex: 1, overflow: 'auto',
    background: '#0D1017',
  },
  editorContent: {
    height: '100%', color: '#E8EBF2',
    fontSize: 16, lineHeight: 1.8,
    fontFamily: "'DM Sans', sans-serif",
  },
}
