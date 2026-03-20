import { useRef, useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { RelationNode } from './RelationNode'
import { NodeAddPopup } from './NodeAddPopup'
import { EditPopup } from './EditPopup'
import { RELATION_OPTIONS } from '@/lib/types'
import { isSpouseResolution } from '@/lib/resolve'
import { getAvatarUrl } from '@/lib/avatar'

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const lastOffset = useRef({ x: 0, y: 0 })

  const nodes = useAppStore(s => s.nodes)
  const edges = useAppStore(s => s.edges)
  const canvasOffset = useAppStore(s => s.canvasOffset)
  const zoom = useAppStore(s => s.zoom)
  const setCanvasOffset = useAppStore(s => s.setCanvasOffset)
  const setZoom = useAppStore(s => s.setZoom)
  const userName = useAppStore(s => s.userName)
  const userGender = useAppStore(s => s.userGender)
  const pinnedPositions = useAppStore(s => s.pinnedPositions)
  const userAvatarSeed = useAppStore(s => s.userAvatarSeed)

  const [_nodeDragId, setNodeDragId] = useState<string | null>(null)
  const nodeDragRef = useRef<{ id: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null)
  const updateNodePosition = useAppStore(s => s.updateNodePosition)

  // Mobile active node state (for showing buttons on tap)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  // Popup state for contextual add buttons
  const [addPopup, setAddPopup] = useState<{ nodeId: string; direction: 'up' | 'down' | 'side'; x: number; y: number } | null>(null)

  // Edit popup state
  const [editPopup, setEditPopup] = useState<{ nodeId: string; x: number; y: number } | null>(null)

  const handleNodeAddClick = useCallback((nodeId: string, direction: 'up' | 'down' | 'side', e: React.MouseEvent) => {
    e.stopPropagation()
    setAddPopup({ nodeId, direction, x: e.clientX, y: e.clientY })
  }, [])

  const handleEditClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditPopup({ nodeId, x: e.clientX, y: e.clientY })
  }, [])

  // Canvas dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.relation-node')) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    lastOffset.current = { ...canvasOffset }
  }, [canvasOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Node dragging
    if (nodeDragRef.current) {
      const dx = (e.clientX - nodeDragRef.current.startX) / zoom
      const dy = (e.clientY - nodeDragRef.current.startY) / zoom
      updateNodePosition(
        nodeDragRef.current.id,
        nodeDragRef.current.nodeStartX + dx,
        nodeDragRef.current.nodeStartY + dy
      )
      return
    }

    // Canvas dragging
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setCanvasOffset(lastOffset.current.x + dx, lastOffset.current.y + dy)
  }, [setCanvasOffset, updateNodePosition, zoom])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (nodeDragRef.current) {
      nodeDragRef.current = null
      setNodeDragId(null)
    }
  }, [])

  // Node dragging
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.stopPropagation()
    nodeDragRef.current = { id: nodeId, startX: e.clientX, startY: e.clientY, nodeStartX: nodeX, nodeStartY: nodeY }
    setNodeDragId(nodeId)
    setActiveNodeId(null)
  }, [])

  // Node touch logic
  const nodeTouchMoveCount = useRef(0)

  const handleNodeTouchStart = useCallback((e: React.TouchEvent, nodeId: string, nodeX: number, nodeY: number) => {
    if (e.touches.length !== 1) return

    nodeTouchMoveCount.current = 0
    nodeDragRef.current = {
      id: nodeId,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      nodeStartX: nodeX,
      nodeStartY: nodeY
    }
    setNodeDragId(nodeId)
    e.stopPropagation() // Prevent canvas from starting pan
  }, [])

  const handleNodeTouchMove = useCallback((e: React.TouchEvent) => {
    if (nodeDragRef.current) {
      e.stopPropagation() // Prevent canvas from panning while we drag node
      const touch = e.touches[0]
      const dx = (touch.clientX - nodeDragRef.current.startX) / zoom
      const dy = (touch.clientY - nodeDragRef.current.startY) / zoom

      // Tolerate small movements to still count as a tap
      if (Math.abs(touch.clientX - nodeDragRef.current.startX) > 5 || Math.abs(touch.clientY - nodeDragRef.current.startY) > 5) {
        nodeTouchMoveCount.current += 1

        // Hide active + buttons as soon as we start actually dragging
        if (nodeTouchMoveCount.current === 1) {
          setActiveNodeId(null)
        }

        updateNodePosition(
          nodeDragRef.current.id,
          nodeDragRef.current.nodeStartX + dx,
          nodeDragRef.current.nodeStartY + dy
        )
      }
    }
  }, [updateNodePosition, zoom])

  const handleNodeTouchEnd = useCallback((e: React.TouchEvent, nodeId: string) => {
    if (nodeDragRef.current) {
      if (nodeTouchMoveCount.current === 0) {
        // It's a short tap — toggle active state (shows buttons)
        setActiveNodeId(prev => prev === nodeId ? null : nodeId)
      }
      nodeDragRef.current = null
      setNodeDragId(null)
      e.stopPropagation()
    }
  }, [])

  // Zoom with wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(zoom + delta)
  }, [zoom, setZoom])

  // Touch support
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStart.current = { x: touch.clientX, y: touch.clientY }
      lastOffset.current = { ...canvasOffset }
    }
  }, [canvasOffset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart.current) {
      const touch = e.touches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      setCanvasOffset(lastOffset.current.x + dx, lastOffset.current.y + dy)
    }
  }, [setCanvasOffset])

  const handleTouchEnd = useCallback(() => {
    touchStart.current = null
    setActiveNodeId(null) // tapping background clears active node
  }, [])

  // Prevent default wheel scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prevent = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', prevent, { passive: false })
    return () => el.removeEventListener('wheel', prevent)
  }, [])

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400

  // Approximate card half-sizes (used for anchor point offsets)
  // All cards are now uniform: 120px wide box, ~80px tall box + ~40px text below
  const USER_HALF_W = 60
  const USER_HALF_H = 40
  const NODE_HALF_W = 60
  const NODE_HALF_H = 40

  const userX = pinnedPositions['user']?.x || 0
  const userY = pinnedPositions['user']?.y || 0

  // Helper to get screen position for a node center
  const getNodeScreenPos = (nodeId: string) => {
    if (nodeId === 'user') {
      return {
        x: centerX + canvasOffset.x + userX * zoom,
        y: centerY + canvasOffset.y + userY * zoom,
      }
    }
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return null
    return {
      x: centerX + canvasOffset.x + node.x * zoom,
      y: centerY + canvasOffset.y + node.y * zoom,
    }
  }

  // Get anchor point on a card edge
  const getAnchor = (
    pos: { x: number; y: number },
    nodeId: string,
    side: 'top' | 'bottom' | 'left' | 'right',
  ) => {
    const isUser = nodeId === 'user'
    const hw = (isUser ? USER_HALF_W : NODE_HALF_W) * zoom
    const hh = (isUser ? USER_HALF_H : NODE_HALF_H) * zoom
    switch (side) {
      case 'top': return { x: pos.x, y: pos.y - hh }
      case 'bottom': return { x: pos.x, y: pos.y + hh }
      case 'left': return { x: pos.x - hw, y: pos.y }
      case 'right': return { x: pos.x + hw, y: pos.y }
    }
  }

  // Determine connection direction for an edge
  const getEdgeDirection = (edge: typeof edges[number]): 'up' | 'down' | 'side' => {
    const option = RELATION_OPTIONS.find(o => o.type === edge.relationType)
    if (!option) return 'side'
    // Use the relation's direction field but resolve it relative to the from→to semantics:
    // 'up' means target is above from (parents)
    // 'down' means target is below from (children)
    // 'side' means target is beside from (siblings/spouse)
    return option.direction
  }

  // Build path between two anchor points using smooth bezier curves
  const buildPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): string => {
    // Sign ensures control points always extend away from each anchor toward the other
    const sign = to.y >= from.y ? 1 : -1
    const dy = Math.abs(to.y - from.y) * 0.5
    return `M ${from.x},${from.y} C ${from.x},${from.y + sign * dy} ${to.x},${to.y - sign * dy} ${to.x},${to.y}`
  }

  // Build couple map: for each coupled node, store its partner's id
  const coupleMap = new Map<string, string>()
  for (const e of edges) {
    const fn = e.fromId !== 'user' ? nodes.find(n => n.id === e.fromId) : null
    const isSpouseEdge =
      e.relationType === 'husband' || e.relationType === 'wife' ||
      (fn != null && isSpouseResolution(fn.relationType, e.relationType))
    if (isSpouseEdge) {
      coupleMap.set(e.fromId, e.toId)
      coupleMap.set(e.toId, e.fromId)
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 cursor-grab active:cursor-grabbing overflow-hidden bg-[var(--color-canvas)]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]">
        <defs>
          <pattern id="grid" width={40 * zoom} height={40 * zoom} patternUnits="userSpaceOnUse"
            x={canvasOffset.x % (40 * zoom)} y={canvasOffset.y % (40 * zoom)}>
            <circle cx={20 * zoom} cy={20 * zoom} r={1} fill="var(--color-ink)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Connection lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {edges.map(edge => {
          const fromCenter = getNodeScreenPos(edge.fromId)
          const toCenter = getNodeScreenPos(edge.toId)
          if (!fromCenter || !toCenter) return null

          const targetNode = nodes.find(n => n.id === edge.toId)
          if (!targetNode) return null

          const direction = getEdgeDirection(edge)
          const fromNode = edge.fromId !== 'user' ? nodes.find(n => n.id === edge.fromId) : null
          const isSpouse =
            edge.relationType === 'husband' || edge.relationType === 'wife' ||
            (fromNode != null && isSpouseResolution(fromNode.relationType, edge.relationType))

          // Determine anchor sides based on direction
          let fromSide: 'top' | 'bottom' | 'left' | 'right'
          let toSide: 'top' | 'bottom' | 'left' | 'right'

          if (isSpouse) {
            // Spouse: straight horizontal line from side to side
            fromSide = toCenter.x >= fromCenter.x ? 'right' : 'left'
            toSide = toCenter.x >= fromCenter.x ? 'left' : 'right'
          } else if (direction === 'up') {
            // Target is above: exit top of "from", enter bottom of "to"
            fromSide = 'top'
            toSide = 'bottom'
          } else {
            // Down or side: exit bottom of "from", enter top of "to"
            fromSide = 'bottom'
            toSide = 'top'
          }

          let fromAnchor = getAnchor(fromCenter, edge.fromId, fromSide)
          let toAnchor = getAnchor(toCenter, edge.toId, toSide)

          // Redirect child↔parent edges to the couple midpoint
          if (!isSpouse) {
            if (direction === 'up') {
              // Child → Parent: if parent (toId) is coupled, draw to couple midpoint
              const partnerId = coupleMap.get(edge.toId)
              if (partnerId) {
                const partnerCenter = getNodeScreenPos(partnerId)
                if (partnerCenter) {
                  toAnchor = {
                    x: (toCenter.x + partnerCenter.x) / 2,
                    y: (toCenter.y + partnerCenter.y) / 2,
                  }
                }
              }
            } else {
              // Parent → Child: if parent (fromId) is coupled and child is below, draw from midpoint
              const partnerId = coupleMap.get(edge.fromId)
              if (partnerId) {
                const sourceLayer = fromNode ? fromNode.layer : 0
                if (targetNode.layer > sourceLayer) {
                  const partnerCenter = getNodeScreenPos(partnerId)
                  if (partnerCenter) {
                    fromAnchor = {
                      x: (fromCenter.x + partnerCenter.x) / 2,
                      y: (fromCenter.y + partnerCenter.y) / 2,
                    }
                  }
                }
              }
            }
          }

          const isSameGender = targetNode.gender === userGender
          const isMahram = edge.mahramResult.isMahram
          const strokeColor = isSameGender
            ? '#9ca3af'
            : isMahram
              ? edge.mahramResult.category === 'mahram_sementara' ? '#ff9800' : '#4caf50'
              : '#f4433660'

          const dx = (toAnchor.x - fromAnchor.x) * 0.5
          const path = isSpouse
            ? `M ${fromAnchor.x},${fromAnchor.y} C ${fromAnchor.x + dx},${fromAnchor.y} ${toAnchor.x - dx},${toAnchor.y} ${toAnchor.x},${toAnchor.y}`
            : buildPath(fromAnchor, toAnchor)

          return (
            <g key={edge.id}>
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                strokeDasharray={edge.mahramResult.category === 'mahram_sementara' ? '6 4' : 'none'}
                opacity={0.6}
                strokeLinejoin="round"
              />
              {/* Small circle at connection point */}
              <circle cx={toAnchor.x} cy={toAnchor.y} r={3} fill={strokeColor} />
            </g>
          )
        })}
      </svg>

      {/* Center user node */}
      <div
        className="absolute z-10 group cursor-grab active:cursor-grabbing relation-node"
        onMouseDown={(e) => handleNodeMouseDown(e, 'user', userX, userY)}
        onTouchStart={(e) => handleNodeTouchStart(e, 'user', userX, userY)}
        onTouchMove={handleNodeTouchMove}
        onTouchEnd={(e) => handleNodeTouchEnd(e, 'user')}
        style={{
          left: centerX + canvasOffset.x + userX * zoom,
          top: centerY + canvasOffset.y + userY * zoom,
          transform: `translate(-50%, -50%) scale(${zoom})`,
          transformOrigin: 'center',
          width: 120,
        }}
      >
        {/* Edit button on user node */}
        <div className={`absolute -top-2 -right-2 z-10 transition-opacity
          ${activeNodeId === 'user' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={(e) => handleEditClick('user', e)}
            className="w-6 h-6 rounded-full bg-[var(--color-ink)] text-white text-[10px]
              flex items-center justify-center cursor-pointer border-2 border-white shadow-sm hover:scale-110"
          >
            ✎
          </button>
        </div>

        <div className="flex flex-col items-center">
          {/* Avatar box — same size as relation nodes */}
          <div
            className="w-[120px] h-[80px] rounded-2xl border-3 flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: userGender === 'male' ? 'var(--color-male-light)' : 'var(--color-female-light)',
              borderColor: userGender === 'male' ? 'var(--color-male)' : 'var(--color-female)',
              boxShadow: `4px 4px 0px ${userGender === 'male' ? 'var(--color-male)' : 'var(--color-female)'}`,
            }}
          >
            <img
              src={getAvatarUrl(userName || 'Saya', userGender ?? undefined, userAvatarSeed || undefined)}
              alt={userName || 'Saya'}
              className="w-16 h-16 rounded-xl"
              draggable={false}
            />
          </div>

          {/* Name */}
          <div className="mt-2 max-w-[160px] font-[var(--font-doodle)] text-sm font-bold text-[var(--color-ink)] text-center leading-tight break-words">
            {userName || 'Saya'}
          </div>

          {/* Label */}
          <div className="mt-1 max-w-[160px] px-2 py-0.5 rounded-lg text-[10px] text-[var(--color-ink-light)] text-center bg-gray-100 break-words leading-tight">
            {userGender === 'male' ? 'Laki-laki' : 'Perempuan'}
          </div>
        </div>

        {/* Directional add buttons on user node */}
        <button
          onClick={(e) => handleNodeAddClick('user', 'up', e)}
          className={`absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full
            bg-[var(--color-ink)] text-white text-sm flex items-center justify-center
            transition-opacity cursor-pointer
            z-10 border-2 border-white shadow-sm hover:scale-110
            ${activeNodeId === 'user' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          +
        </button>
        <button
          onClick={(e) => handleNodeAddClick('user', 'down', e)}
          className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full
            bg-[var(--color-ink)] text-white text-sm flex items-center justify-center
            transition-opacity cursor-pointer
            z-10 border-2 border-white shadow-sm hover:scale-110
            ${activeNodeId === 'user' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          +
        </button>
        <button
          onClick={(e) => handleNodeAddClick('user', 'side', e)}
          className={`absolute top-1/2 -right-3 -translate-y-1/2 w-7 h-7 rounded-full
            bg-[var(--color-ink)] text-white text-sm flex items-center justify-center
            transition-opacity cursor-pointer
            z-10 border-2 border-white shadow-sm hover:scale-110
            ${activeNodeId === 'user' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          +
        </button>
      </div>

      {/* Relation nodes */}
      {nodes.map(node => {
        const edge = edges.find(e => e.toId === node.id)
        if (!edge) return null

        return (
          <div
            key={node.id}
            className="absolute z-10 relation-node"
            style={{
              left: centerX + canvasOffset.x + node.x * zoom,
              top: centerY + canvasOffset.y + node.y * zoom,
              transform: `translate(-50%, -50%) scale(${zoom})`,
              transformOrigin: 'center',
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id, node.x, node.y)}
            onTouchStart={(e) => handleNodeTouchStart(e, node.id, node.x, node.y)}
            onTouchMove={handleNodeTouchMove}
            onTouchEnd={(e) => handleNodeTouchEnd(e, node.id)}
          >
            <RelationNode
              node={node}
              mahramResult={edge.mahramResult}
              onAddClick={handleNodeAddClick}
              onEditClick={handleEditClick}
              isActive={activeNodeId === node.id}
            />
          </div>
        )
      })}

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
          <p className="font-[var(--font-doodle)] text-xl text-[var(--color-ink-light)] animate-bounce">
            Tekan tombol + untuk menambahkan relasi
          </p>
        </div>
      )}

      {/* Node add popup */}
      {addPopup && (
        <NodeAddPopup
          nodeId={addPopup.nodeId}
          direction={addPopup.direction}
          x={addPopup.x}
          y={addPopup.y}
          onClose={() => setAddPopup(null)}
        />
      )}

      {/* Edit popup */}
      {editPopup && (
        <EditPopup
          nodeId={editPopup.nodeId}
          x={editPopup.x}
          y={editPopup.y}
          onClose={() => setEditPopup(null)}
        />
      )}
    </div>
  )
}
