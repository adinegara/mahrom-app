import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Gender, PersonNode, RelationEdge, RelationType } from '@/lib/types'
import { checkMahram } from '@/lib/mahram'
import { RELATION_OPTIONS } from '@/lib/types'
import { calculateTreeLayout } from '@/lib/layout'
import { BASE_RELATIONS, resolveRelation } from '@/lib/resolve'

interface AppState {
  // User setup
  userGender: Gender | null
  userName: string
  isSetup: boolean

  // Canvas
  nodes: PersonNode[]
  edges: RelationEdge[]
  canvasOffset: { x: number; y: number }
  zoom: number

  // Manually dragged positions keyed by node id
  pinnedPositions: Record<string, { x: number; y: number }>

  // Actions
  setUserProfile: (gender: Gender, name: string) => void
  addRelation: (relationType: RelationType, name?: string) => void
  addRelationToNode: (parentNodeId: string, relationType: RelationType, name?: string) => void
  removeNode: (nodeId: string) => void
  updateNodePosition: (nodeId: string, x: number, y: number) => void
  setCanvasOffset: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  reset: () => void
}

let nodeCounter = 0

/**
 * Among existing nodes directly connected to 'user', find one that logically
 * serves as the parent of newRelationType via the resolve map.
 * e.g. if father exists and newRelationType is 'mother', returns father's id.
 */
function findPreferredParentInGraph(
  newRelationType: RelationType,
  nodes: PersonNode[],
  edges: RelationEdge[],
): string | null {
  for (const edge of edges) {
    if (edge.fromId !== 'user') continue
    const node = nodes.find(n => n.id === edge.toId)
    if (!node) continue
    for (const base of BASE_RELATIONS) {
      if (resolveRelation(node.relationType, base.type) === newRelationType) {
        return node.id
      }
    }
  }
  return null
}

/**
 * Find the parent node ID that a relation should attach to.
 * If the required parent doesn't exist, auto-create it.
 */
function findOrCreateParent(
  option: (typeof RELATION_OPTIONS)[number],
  nodes: PersonNode[],
  edges: RelationEdge[],
  userGender: Gender,
  preferredParentId: string | null = null,
): { parentNodeId: string; newNodes: PersonNode[]; newEdges: RelationEdge[] } {
  const newNodes: PersonNode[] = []
  const newEdges: RelationEdge[] = []

  if (preferredParentId && preferredParentId !== 'user') {
    if (option.parentRelation) {
      const prefNode = [...nodes, ...newNodes].find(n => n.id === preferredParentId)
      if (prefNode && prefNode.relationType === option.parentRelation) {
        return { parentNodeId: preferredParentId, newNodes, newEdges }
      }
      
      // Check adjacent nodes (like the spouse) for a match
      const adjacentEdges = [...edges, ...newEdges].filter(e => e.fromId === preferredParentId || e.toId === preferredParentId)
      for (const e of adjacentEdges) {
        const adjId = e.fromId === preferredParentId ? e.toId : e.fromId
        const adjNode = [...nodes, ...newNodes].find(n => n.id === adjId)
        if (adjNode && adjNode.relationType === option.parentRelation) {
          return { parentNodeId: adjId, newNodes, newEdges }
        }
      }
    }
  }

  if (!option.parentRelation) {
    // Check if an existing direct-user-child is the logical parent
    const preferred = findPreferredParentInGraph(option.type, nodes, edges)
    if (preferred) {
      return { parentNodeId: preferred, newNodes, newEdges }
    }

    // Special case: in-laws attach to spouse
    if (option.type === 'father_in_law' || option.type === 'mother_in_law') {
      const spouseType: RelationType = userGender === 'male' ? 'wife' : 'husband'
      const spouseEdge = [...edges, ...newEdges].find(e => e.relationType === spouseType)
      if (spouseEdge) {
        return { parentNodeId: spouseEdge.toId, newNodes, newEdges }
      }
      // Auto-create spouse
      const spouseOption = RELATION_OPTIONS.find(o => o.type === spouseType)
      if (spouseOption) {
        const spouseNodeId = `node-${++nodeCounter}`
        const spouseEdgeId = `edge-${nodeCounter}`
        const spouseMahram = checkMahram(userGender, spouseType)
        newNodes.push({
          id: spouseNodeId,
          name: spouseOption.labelId,
          gender: spouseOption.gender,
          relationType: spouseType,
          x: 0, y: 0,
          layer: spouseOption.layer,
        })
        newEdges.push({
          id: spouseEdgeId,
          fromId: 'user',
          toId: spouseNodeId,
          relationType: spouseType,
          mahramResult: spouseMahram,
        })
        return { parentNodeId: spouseNodeId, newNodes, newEdges }
      }
    }
    // Attaches directly to user
    return { parentNodeId: 'user', newNodes, newEdges }
  }

  // Look for existing node with this relation type
  const existingParentEdge = edges.find(e => {
    const opt = RELATION_OPTIONS.find(o => o.type === e.relationType)
    return opt && e.relationType === option.parentRelation
  })

  if (existingParentEdge) {
    return { parentNodeId: existingParentEdge.toId, newNodes, newEdges }
  }

  // Parent doesn't exist — auto-create it
  const parentOption = RELATION_OPTIONS.find(o => o.type === option.parentRelation)
  if (!parentOption) {
    return { parentNodeId: 'user', newNodes, newEdges }
  }

  // Recursively ensure the parent's parent exists
  // We don't pass preferredParentId down because it only applies to the direct parent we were looking for
  const {
    parentNodeId: grandParentNodeId,
    newNodes: gpNodes,
    newEdges: gpEdges,
  } = findOrCreateParent(parentOption, [...nodes, ...newNodes], [...edges, ...newEdges], userGender)

  newNodes.push(...gpNodes)
  newEdges.push(...gpEdges)

  const parentNodeId = `node-${++nodeCounter}`
  const parentEdgeId = `edge-${nodeCounter}`

  const parentMahramResult = checkMahram(userGender, parentOption.type)

  const parentNode: PersonNode = {
    id: parentNodeId,
    name: parentOption.labelId,
    gender: parentOption.gender,
    relationType: parentOption.type,
    x: 0,
    y: 0,
    layer: parentOption.layer,
  }

  const parentEdge: RelationEdge = {
    id: parentEdgeId,
    fromId: grandParentNodeId,
    toId: parentNodeId,
    relationType: parentOption.type,
    mahramResult: parentMahramResult,
  }

  newNodes.push(parentNode)
  newEdges.push(parentEdge)

  // Auto-create spouse when auto-creating a parent that has a spouse mapping
  const spouseBase = parentOption.gender === 'male' ? 'wife' as const : 'husband' as const
  const spouseRelType = resolveRelation(parentOption.type, spouseBase)
  if (spouseRelType) {
    const spouseOpt = RELATION_OPTIONS.find(o => o.type === spouseRelType)
    const alreadyExists = [...edges, ...newEdges].some(e => e.relationType === spouseRelType)
    if (spouseOpt && !alreadyExists) {
      const spNid = `node-${++nodeCounter}`
      const spEid = `edge-${nodeCounter}`
      const spMahram = checkMahram(userGender, spouseRelType)
      newNodes.push({
        id: spNid,
        name: spouseOpt.labelId,
        gender: spouseOpt.gender,
        relationType: spouseRelType,
        x: 0, y: 0,
        layer: spouseOpt.layer,
      })
      newEdges.push({
        id: spEid,
        fromId: parentNodeId,
        toId: spNid,
        relationType: spouseRelType,
        mahramResult: spMahram,
      })
    }
  }

  return { parentNodeId, newNodes, newEdges }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userGender: null,
      userName: '',
      isSetup: false,
      nodes: [],
      edges: [],
      canvasOffset: { x: 0, y: 0 },
      zoom: 1,
      pinnedPositions: {},

      setUserProfile: (gender, name) => {
        set({ userGender: gender, userName: name, isSetup: true })
      },

      addRelation: (relationType, name) => {
        const state = get()
        if (!state.userGender) return

        const option = RELATION_OPTIONS.find(o => o.type === relationType)
        if (!option) return

        // Find or auto-create the parent node
        const { parentNodeId, newNodes, newEdges } = findOrCreateParent(
          option,
          state.nodes,
          state.edges,
          state.userGender,
        )

        // Check if this relation was already auto-created as a spouse
        const alreadyCreated = newNodes.find(n => n.relationType === relationType)
        if (alreadyCreated) {
          if (name) alreadyCreated.name = name
          const allNodes = [...state.nodes, ...newNodes]
          const allEdges = [...state.edges, ...newEdges]
          const layoutNodes = calculateTreeLayout(allNodes, allEdges).map(n =>
            state.pinnedPositions[n.id] ? { ...n, ...state.pinnedPositions[n.id] } : n
          )
          set({ nodes: layoutNodes, edges: allEdges })
          return
        }

        const mahramResult = checkMahram(state.userGender, relationType)

        const nodeId = `node-${++nodeCounter}`
        const edgeId = `edge-${nodeCounter}`

        const newNode: PersonNode = {
          id: nodeId,
          name: name || option.labelId,
          gender: option.gender,
          relationType: relationType,
          x: 0,
          y: 0,
          layer: option.layer,
        }

        const newEdge: RelationEdge = {
          id: edgeId,
          fromId: parentNodeId,
          toId: nodeId,
          relationType,
          mahramResult,
        }

        const allNodes = [...state.nodes, ...newNodes, newNode]
        const allEdges = [...state.edges, ...newEdges, newEdge]

        // Auto-create spouse for directly-added parent-type nodes
        if (option.direction === 'up') {
          const spBase = option.gender === 'male' ? 'wife' as const : 'husband' as const
          const spRelType = resolveRelation(relationType, spBase)
          if (spRelType) {
            const spOpt = RELATION_OPTIONS.find(o => o.type === spRelType)
            const spExists = allEdges.some(e => e.relationType === spRelType)
            if (spOpt && !spExists) {
              const spNid = `node-${++nodeCounter}`
              const spEid = `edge-${nodeCounter}`
              const spMahram = checkMahram(state.userGender, spRelType)
              allNodes.push({
                id: spNid,
                name: spOpt.labelId,
                gender: spOpt.gender,
                relationType: spRelType,
                x: 0, y: 0,
                layer: spOpt.layer,
              })
              allEdges.push({
                id: spEid,
                fromId: nodeId,
                toId: spNid,
                relationType: spRelType,
                mahramResult: spMahram,
              })
            }
          }
        }

        // Recalculate tree layout, then restore any manually pinned positions
        const layoutNodes = calculateTreeLayout(allNodes, allEdges).map(n =>
          state.pinnedPositions[n.id] ? { ...n, ...state.pinnedPositions[n.id] } : n
        )

        set({
          nodes: layoutNodes,
          edges: allEdges,
        })
      },

      addRelationToNode: (_parentNodeId, relationType, name) => {
        const state = get()
        if (!state.userGender) return

        const option = RELATION_OPTIONS.find(o => o.type === relationType)
        if (!option) return

        // Use findOrCreateParent to determine the correct parent,
        // preferring the node that was clicked (_parentNodeId)
        const { parentNodeId: resolvedParentId, newNodes, newEdges } = findOrCreateParent(
          option,
          state.nodes,
          state.edges,
          state.userGender,
          _parentNodeId
        )

        // Check if this relation was already auto-created as a spouse
        const alreadyCreated = newNodes.find(n => n.relationType === relationType)
        if (alreadyCreated) {
          if (name) alreadyCreated.name = name
          const allNodes = [...state.nodes, ...newNodes]
          const allEdges = [...state.edges, ...newEdges]
          const layoutNodes = calculateTreeLayout(allNodes, allEdges).map(n =>
            state.pinnedPositions[n.id] ? { ...n, ...state.pinnedPositions[n.id] } : n
          )
          set({ nodes: layoutNodes, edges: allEdges })
          return
        }

        const mahramResult = checkMahram(state.userGender, relationType)

        const nodeId = `node-${++nodeCounter}`
        const edgeId = `edge-${nodeCounter}`

        const newNode: PersonNode = {
          id: nodeId,
          name: name || option.labelId,
          gender: option.gender,
          relationType: relationType,
          x: 0,
          y: 0,
          layer: option.layer,
        }

        const newEdge: RelationEdge = {
          id: edgeId,
          fromId: resolvedParentId,
          toId: nodeId,
          relationType,
          mahramResult,
        }

        const allNodes = [...state.nodes, ...newNodes, newNode]
        const allEdges = [...state.edges, ...newEdges, newEdge]

        // Auto-create spouse for directly-added parent-type nodes
        if (option.direction === 'up') {
          const spBase = option.gender === 'male' ? 'wife' as const : 'husband' as const
          const spRelType = resolveRelation(relationType, spBase)
          if (spRelType) {
            const spOpt = RELATION_OPTIONS.find(o => o.type === spRelType)
            const spExists = allEdges.some(e => e.relationType === spRelType)
            if (spOpt && !spExists) {
              const spNid = `node-${++nodeCounter}`
              const spEid = `edge-${nodeCounter}`
              const spMahram = checkMahram(state.userGender, spRelType)
              allNodes.push({
                id: spNid,
                name: spOpt.labelId,
                gender: spOpt.gender,
                relationType: spRelType,
                x: 0, y: 0,
                layer: spOpt.layer,
              })
              allEdges.push({
                id: spEid,
                fromId: nodeId,
                toId: spNid,
                relationType: spRelType,
                mahramResult: spMahram,
              })
            }
          }
        }

        // Recalculate tree layout, then restore any manually pinned positions
        const layoutNodes = calculateTreeLayout(allNodes, allEdges).map(n =>
          state.pinnedPositions[n.id] ? { ...n, ...state.pinnedPositions[n.id] } : n
        )

        set({
          nodes: layoutNodes,
          edges: allEdges,
        })
      },

      removeNode: (nodeId) => {
        const state = get()

        // Find the parent of the removed node
        const removedEdge = state.edges.find(e => e.toId === nodeId)
        const parentId = removedEdge ? removedEdge.fromId : 'user'

        // Reconnect direct children of the removed node to its parent
        const childEdges = state.edges
          .filter(e => e.fromId === nodeId)
          .map(e => ({ ...e, fromId: parentId }))

        // Remove the node and its direct edge, replace child edges
        const newNodes = state.nodes.filter(n => n.id !== nodeId)
        const newEdges = [
          ...state.edges.filter(e => e.toId !== nodeId && e.fromId !== nodeId),
          ...childEdges,
        ]

        // Drop pinned position for removed node
        const { [nodeId]: _removed, ...remainingPinned } = state.pinnedPositions

        // Recalculate layout, restore remaining pinned positions
        const layoutNodes = calculateTreeLayout(newNodes, newEdges).map(n =>
          remainingPinned[n.id] ? { ...n, ...remainingPinned[n.id] } : n
        )

        set({
          nodes: layoutNodes,
          edges: newEdges,
          pinnedPositions: remainingPinned,
        })
      },

      updateNodePosition: (nodeId, x, y) => {
        set(state => ({
          nodes: state.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n),
          pinnedPositions: { ...state.pinnedPositions, [nodeId]: { x, y } },
        }))
      },

      setCanvasOffset: (x, y) => set({ canvasOffset: { x, y } }),
      setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(2, zoom)) }),

      reset: () => {
        nodeCounter = 0
        set({
          userGender: null,
          userName: '',
          isSetup: false,
          nodes: [],
          edges: [],
          canvasOffset: { x: 0, y: 0 },
          zoom: 1,
          pinnedPositions: {},
        })
      },
    }),
    {
      name: 'mahrom-app-store',
    }
  )
)
