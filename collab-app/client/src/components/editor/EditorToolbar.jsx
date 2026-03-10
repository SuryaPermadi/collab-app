export default function EditorToolbar({ editor }) {
  if (!editor) return null

  const tools = [
    {
      label: 'B', title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      label: 'I', title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
      style: { fontStyle: 'italic' },
    },
    {
      label: 'S', title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
      style: { textDecoration: 'line-through' },
    },
    { type: 'divider' },
    {
      label: 'H1', title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'H2', title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'H3', title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    { type: 'divider' },
    {
      label: '≡', title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      label: '1.', title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      label: '☑', title: 'Task List',
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: () => editor.isActive('taskList'),
    },
    { type: 'divider' },
    {
      label: '{ }', title: 'Code Block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock'),
      style: { fontFamily: 'monospace' },
    },
    {
      label: '❝', title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    { type: 'divider' },
    {
      label: '↩', title: 'Undo',
      action: () => editor.chain().focus().undo().run(),
    },
    {
      label: '↪', title: 'Redo',
      action: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <div style={styles.toolbar}>
      {tools.map((tool, i) => {
        if (tool.type === 'divider') {
          return <div key={i} style={styles.divider} />
        }
        const active = tool.isActive?.()
        return (
          <button
            key={i}
            title={tool.title}
            onClick={tool.action}
            style={{
              ...styles.btn,
              ...(tool.style || {}),
              ...(active ? styles.btnActive : {}),
            }}
          >
            {tool.label}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 2,
    padding: '8px 16px', borderBottom: '1px solid #1E2433',
    background: '#0F1420', flexWrap: 'wrap',
  },
  btn: {
    background: 'none', border: 'none', color: '#5A6380',
    padding: '6px 10px', cursor: 'pointer', fontSize: 13,
    fontFamily: 'inherit', fontWeight: 700, borderRadius: 2,
    transition: 'background 0.15s, color 0.15s', minWidth: 32,
  },
  btnActive: {
    background: '#1E2433', color: '#00E5C3',
  },
  divider: { width: 1, height: 20, background: '#1E2433', margin: '0 4px' },
}
