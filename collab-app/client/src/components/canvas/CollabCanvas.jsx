import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text, Transformer, Arrow } from 'react-konva'
import { v4 as uuidv4 } from 'uuid'
import { getSocket } from '../../hooks/useSocket.js'
import { useAuthStore } from '../../stores/index.js'
import { useRoomStore } from '../../stores/index.js'
import CanvasToolbar from './CanvasToolbar.jsx'
import LiveCursors from './LiveCursors.jsx'
export default function CollabCanvas({ roomId }) {
  const [shapes, setShapes] = useState([])
  const [tool, setTool] = useState('select') // select | rect | circle | arrow | text | pen
  const [selectedId, setSelectedId] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentLine, setCurrentLine] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const containerRef = useRef(null)
  const socket = getSocket()
  const user = useAuthStore(s => s.user)
  const cursors = useRoomStore(s => s.cursors)

  // Update stage size saat container resize
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Load shapes dari server
  useEffect(() => {
    if (!socket) return
    socket.emit('canvas:get')

    const onLoaded = ({ shapes: serverShapes }) => {
      setShapes(serverShapes.map(s => ({ ...s, ...s.props, id: s.id })))
    }

    const onAdded = ({ shape }) => {
      setShapes(prev => [...prev.filter(s => s.id !== shape.id), { ...shape, ...shape.props }])
    }

    const onUpdated = ({ id, props }) => {
      setShapes(prev => prev.map(s => s.id === id ? { ...s, ...props } : s))
    }

    const onDeleted = ({ id }) => {
      setShapes(prev => prev.filter(s => s.id !== id))
    }

    const onDragging = ({ userId, id, x, y }) => {
      if (userId === user?.id) return
      setShapes(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
    }

    socket.on('canvas:loaded', onLoaded)
    socket.on('shape:added', onAdded)
    socket.on('shape:updated', onUpdated)
    socket.on('shape:deleted', onDeleted)
    socket.on('shape:dragging', onDragging)

    return () => {
      socket.off('canvas:loaded', onLoaded)
      socket.off('shape:added', onAdded)
      socket.off('shape:updated', onUpdated)
      socket.off('shape:deleted', onDeleted)
      socket.off('shape:dragging', onDragging)
    }
  }, [socket])

  // Update transformer saat selectedId berubah
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    const node = stageRef.current.findOne(`#${selectedId}`)
    if (node) {
      transformerRef.current.nodes([node])
    } else {
      transformerRef.current.nodes([])
    }
  }, [selectedId])

  // ─── Mouse tracking untuk live cursor ──────────────────
  const handleMouseMove = useCallback((e) => {
    const stage = stageRef.current
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (pos) {
      socket?.emit('canvas:cursor', { x: pos.x, y: pos.y })
    }
  }, [socket])

  // ─── Tambah shape ─────────────────────────────────────
  const addShape = useCallback((type, x, y) => {
    const id = uuidv4()
    const defaults = {
      rect: { width: 120, height: 80, fill: 'var(--border)', stroke: '#00E5C3', strokeWidth: 1 },
      circle: { radius: 50, fill: 'var(--border)', stroke: '#7B61FF', strokeWidth: 1 },
      text: { text: 'Teks', fontSize: 18, fill: 'var(--text)' },
    }

    const shape = {
      id,
      type,
      x, y,
      ...(defaults[type] || {}),
    }

    // Optimistic update lokal dulu
    setShapes(prev => [...prev, shape])

    // Kirim ke server
    socket?.emit('shape:add', {
      shape: {
        id,
        type,
        props: shape,
        zIndex: shapes.length,
      }
    })
  }, [socket, shapes.length])

  // ─── Stage click: tambah shape atau deselect ──────────
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
    }

    if (tool === 'rect') {
      const pos = e.target.getStage().getPointerPosition()
      addShape('rect', pos.x - 60, pos.y - 40)
      setTool('select')
    } else if (tool === 'circle') {
      const pos = e.target.getStage().getPointerPosition()
      addShape('circle', pos.x, pos.y)
      setTool('select')
    } else if (tool === 'text') {
      const pos = e.target.getStage().getPointerPosition()
      addShape('text', pos.x, pos.y)
      setTool('select')
    }
  }, [tool, addShape])

  // ─── Pen drawing ───────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (tool !== 'pen') return
    setIsDrawing(true)
    const pos = stageRef.current.getPointerPosition()
    setCurrentLine({ points: [pos.x, pos.y], stroke: '#00E5C3', strokeWidth: 2, id: uuidv4() })
  }, [tool])

  const handleMouseMoveDrawing = useCallback((e) => {
    if (tool === 'pen' && isDrawing && currentLine) {
      const pos = stageRef.current.getPointerPosition()
      setCurrentLine(prev => ({
        ...prev,
        points: [...prev.points, pos.x, pos.y],
      }))
    }
  }, [tool, isDrawing, currentLine])

  const handleMouseUp = useCallback(() => {
    if (tool === 'pen' && currentLine) {
      const id = currentLine.id
      setShapes(prev => [...prev, { ...currentLine, type: 'line' }])
      socket?.emit('shape:add', {
        shape: { id, type: 'line', props: currentLine, zIndex: shapes.length }
      })
      setCurrentLine(null)
      setIsDrawing(false)
    }
  }, [tool, currentLine, socket, shapes.length])

  // ─── Shape drag ───────────────────────────────────────
  const handleDragMove = useCallback((e, id) => {
    const { x, y } = e.target.position()
    socket?.emit('shape:dragging', { id, x, y })
  }, [socket])

  const handleDragEnd = useCallback((e, id) => {
    const { x, y } = e.target.position()
    setShapes(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
    socket?.emit('shape:update', { id, props: { x, y } })
  }, [socket])

  // ─── Transform end (resize) ───────────────────────────
  const handleTransformEnd = useCallback((e, id) => {
    const node = e.target
    const props = {
      x: node.x(), y: node.y(),
      scaleX: node.scaleX(), scaleY: node.scaleY(),
      rotation: node.rotation(),
    }
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...props } : s))
    socket?.emit('shape:update', { id, props })
  }, [socket])

  // ─── Delete selected ─────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setShapes(prev => prev.filter(s => s.id !== selectedId))
    socket?.emit('shape:delete', { id: selectedId })
    setSelectedId(null)
  }, [selectedId, socket])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteSelected])

  const renderShape = (shape) => {
    const commonProps = {
      key: shape.id,
      id: shape.id,
      x: shape.x,
      y: shape.y,
      scaleX: shape.scaleX || 1,
      scaleY: shape.scaleY || 1,
      rotation: shape.rotation || 0,
      draggable: tool === 'select',
      onClick: () => tool === 'select' && setSelectedId(shape.id),
      onDragMove: (e) => handleDragMove(e, shape.id),
      onDragEnd: (e) => handleDragEnd(e, shape.id),
      onTransformEnd: (e) => handleTransformEnd(e, shape.id),
    }

    switch (shape.type) {
      case 'rect': return <Rect {...commonProps} width={shape.width} height={shape.height} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} cornerRadius={2} />
      case 'circle': return <Circle {...commonProps} radius={shape.radius} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />
      case 'text': return <Text {...commonProps} text={shape.text} fontSize={shape.fontSize} fill={shape.fill} />
      case 'line': return <Line key={shape.id} points={shape.points} stroke={shape.stroke} strokeWidth={shape.strokeWidth} tension={0.5} lineCap="round" />
      default: return null
    }
  }

  return (
    <div ref={containerRef} style={styles.wrap}>
      <CanvasToolbar tool={tool} setTool={setTool} onDelete={deleteSelected} hasSelection={!!selectedId} />

      <div style={styles.canvasWrap}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseMove={(e) => { handleMouseMove(e); handleMouseMoveDrawing(e) }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleStageClick}
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
        >
          <Layer>
            {shapes.map(renderShape)}
            {currentLine && (
              <Line points={currentLine.points} stroke={currentLine.stroke} strokeWidth={currentLine.strokeWidth} tension={0.5} lineCap="round" />
            )}
            <Transformer ref={transformerRef} />
          </Layer>

          {/* Live cursors Konva layer dihapus, diganti HTML overlay di bawah */}
        </Stage>

        {/* Live cursors HTML overlay */}
        <LiveCursors cursors={cursors} currentUserId={user?.id} />

        {/* Hint */}
        {tool !== 'select' && (
          <div style={styles.hint}>
            Klik di canvas untuk menambahkan {tool}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' },
  canvasWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  hint: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--bgPanel)', border: '1px solid #1E2433', color: 'var(--textMuted)',
    padding: '8px 16px', fontSize: 12, fontFamily: 'monospace', pointerEvents: 'none',
  },
}