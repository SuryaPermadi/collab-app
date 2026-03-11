import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import * as Y from 'yjs'
import { getSocket } from '../../hooks/useSocket.js'
import { useAuthStore, useRoomStore } from '../../stores/index.js'
import EditorToolbar from './EditorToolbar.jsx'
import LiveCursors from '../canvas/LiveCursors.jsx'

export default function CollabEditor({ roomId }) {
  const socket = getSocket()
  const user = useAuthStore(s => s.user)
  const cursors = useRoomStore(s => s.cursors)
  const ydocRef = useRef(new Y.Doc())
  const editorRef = useRef(null)
  const containerRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    socket?.emit('canvas:cursor', {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydocRef.current }),
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

  editorRef.current = editor

  useEffect(() => {
    if (!socket || !roomId) return

    const ydoc = ydocRef.current

    const onLoaded = ({ update }) => {
      if (update && update.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
      }
    }

    const onUpdate = ({ update }) => {
      if (update && update.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
      }
    }

    const handleDocChange = (update, origin) => {
      if (origin !== 'remote') {
        socket.emit('doc:update', { update: Array.from(update) })
      }
    }

    socket.on('doc:loaded', onLoaded)
    socket.on('doc:update', onUpdate)
    ydoc.on('update', handleDocChange)

    // Tunggu 500ms agar room:join selesai di server
    const timer = setTimeout(() => {
      socket.emit('doc:get')
    }, 500)

    return () => {
      clearTimeout(timer)
      socket.off('doc:loaded', onLoaded)
      socket.off('doc:update', onUpdate)
      ydoc.off('update', handleDocChange)
    }
  }, [roomId, socket])

  useEffect(() => {
    return () => {
      ydocRef.current?.destroy()
    }
  }, [])

  if (!editor) return null

  return (
    <div style={styles.wrap}>
      <EditorToolbar editor={editor} />
      <div
        ref={containerRef}
        style={{ ...styles.editorArea, position: 'relative' }}
        onMouseMove={handleMouseMove}
      >
        <EditorContent editor={editor} style={styles.editorContent} />
        <LiveCursors cursors={cursors} currentUserId={user?.id} />
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: 'var(--bg)',
  },
  editorArea: {
    flex: 1, overflow: 'auto',
    background: 'var(--bgPanel)',
  },
  editorContent: {
    height: '100%', color: 'var(--text)',
    fontSize: 16, lineHeight: 1.8,
    fontFamily: "'DM Sans', sans-serif",
  },
}