import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Gender, MahramResult, PersonNode, RelationEdge, RelationType } from '@/lib/types'
import { checkMahram } from '@/lib/mahram'
import { RELATION_OPTIONS } from '@/lib/types'
import { calculateTreeLayout } from '@/lib/layout'
import { BASE_RELATIONS, resolveRelation } from '@/lib/resolve'

export interface ChartDatum {
  id: string
  data: { gender: 'M' | 'F'; 'first name': string; [key: string]: unknown }
  rels: { parents: string[]; spouses: string[]; children: string[] }
}

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

  // User avatar seed
  userAvatarSeed: string

  // Actions
  setUserProfile: (gender: Gender, name: string) => void
  addRelation: (relationType: RelationType, name?: string) => void
  addRelationToNode: (parentNodeId: string, relationType: RelationType, name?: string) => void
  addDirectParent: (targetNodeId: string, relationType: RelationType, name?: string) => void
  updateNodeName: (nodeId: string, name: string) => void
  updateAvatarSeed: (nodeId: string, seed: string) => void
  removeNode: (nodeId: string) => void
  updateNodePosition: (nodeId: string, x: number, y: number) => void
  setCanvasOffset: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  syncFromTreeData: (chartData: ChartDatum[]) => void
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
  userGender: Gender,
): string | null {
  for (const edge of edges) {
    if (edge.fromId !== 'user') continue
    const node = nodes.find(n => n.id === edge.toId)
    if (!node) continue
    for (const base of BASE_RELATIONS) {
      if (resolveRelation(node.relationType, base.type, userGender) === newRelationType) {
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
    const preferred = findPreferredParentInGraph(option.type, nodes, edges, userGender)
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
    const parentOpt = RELATION_OPTIONS.find(o => o.type === existingParentEdge.relationType)
    const parentIsDirectParent = parentOpt?.parentRelation === undefined
    if (!parentIsDirectParent) {
      return { parentNodeId: existingParentEdge.toId, newNodes, newEdges }
    }
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
  const spouseRelType = resolveRelation(parentOption.type, spouseBase, userGender)
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
      userAvatarSeed: '',

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

        // Recalculate tree layout, then restore any manually pinned positions
        const layoutNodes = calculateTreeLayout(allNodes, allEdges).map(n =>
          state.pinnedPositions[n.id] ? { ...n, ...state.pinnedPositions[n.id] } : n
        )

        set({
          nodes: layoutNodes,
          edges: allEdges,
        })
      },

      /**
       * Add a parent directly to a target node, bypassing findOrCreateParent.
       * Used for adding extra fathers / ibu susuan when the normal route
       * would mis-attach via findPreferredParentInGraph.
       * Does NOT auto-create spouse — co-parent pairing in toFamilyChartData handles it.
       */
      addDirectParent: (targetNodeId, relationType, name) => {
        const state = get()
        if (!state.userGender) return

        const option = RELATION_OPTIONS.find(o => o.type === relationType)
        if (!option) return

        const nodeId = `node-${++nodeCounter}`
        const edgeId = `edge-${nodeCounter}`

        const newNode: PersonNode = {
          id: nodeId,
          name: name || option.labelId,
          gender: option.gender,
          relationType,
          x: 0, y: 0,
          layer: option.layer,
        }

        const mahramResult = checkMahram(state.userGender, relationType)

        const newEdge: RelationEdge = {
          id: edgeId,
          fromId: targetNodeId,
          toId: nodeId,
          relationType,
          mahramResult,
        }

        const allNodes = [...state.nodes, newNode]
        const allEdges = [...state.edges, newEdge]

        const layoutNodes = calculateTreeLayout(allNodes, allEdges).map(n =>
          state.pinnedPositions[n.id] ? { ...n, ...state.pinnedPositions[n.id] } : n
        )

        set({ nodes: layoutNodes, edges: allEdges })
      },

      updateNodeName: (nodeId, name) => {
        set(state => ({
          nodes: state.nodes.map(n => n.id === nodeId ? { ...n, name } : n),
        }))
      },

      updateAvatarSeed: (nodeId, seed) => {
        if (nodeId === 'user') {
          set({ userAvatarSeed: seed })
        } else {
          set(state => ({
            nodes: state.nodes.map(n => n.id === nodeId ? { ...n, avatarSeed: seed } : n),
          }))
        }
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

      syncFromTreeData: (chartData) => {
        const state = get()
        if (!state.userGender) return

        const chartMap = new Map(chartData.map(d => [d.id, d]))
        const oldNodeMap = new Map(state.nodes.map(n => [n.id, n]))

        const nodes: PersonNode[] = []
        const edges: RelationEdge[] = []
        const resolvedType = new Map<string, RelationType>()
        const visited = new Set<string>(['user'])
        // Track nodes whose resolve chain broke — they and all descendants are bukan_mahram
        const chainBroken = new Set<string>()
        let edgeIdx = 0

        const BUKAN_MAHRAM: MahramResult = {
          isMahram: false,
          category: 'bukan_mahram',
          label: 'Bukan Mahram',
          reason: 'Tidak termasuk dalam kategori mahram',
        }

        const userDatum = chartMap.get('user')
        if (!userDatum) return

        // BFS queue: { id, from }
        const queue: { id: string; from: string }[] = []

        const enqueue = (ids: string[], from: string) => {
          for (const id of ids) {
            if (!visited.has(id)) {
              visited.add(id)
              queue.push({ id, from })
            }
          }
        }

        // Helper to get a descriptive label for the structural path
        const describeBaseRel = (baseRel: string): string => {
          switch (baseRel) {
            case 'son': return 'Anak Lk'
            case 'daughter': return 'Anak Pr'
            case 'father': return 'Bapak'
            case 'mother': return 'Ibu'
            case 'husband': return 'Suami'
            case 'wife': return 'Istri'
            default: return baseRel
          }
        }

        enqueue(userDatum.rels.parents || [], 'user')
        enqueue(userDatum.rels.spouses || [], 'user')
        enqueue(userDatum.rels.children || [], 'user')

        while (queue.length > 0) {
          const { id, from } = queue.shift()!
          const datum = chartMap.get(id)
          if (!datum) continue

          const gender: Gender = datum.data.gender === 'M' ? 'male' : 'female'
          const oldNode = oldNodeMap.get(id)

          // Determine the structural relationship of this node to 'from'
          const fromDatum = chartMap.get(from)
          const isParentOfFrom = (fromDatum?.rels.parents || []).includes(id)
          const isSpouseOfFrom = (fromDatum?.rels.spouses || []).includes(id)
          const edgeKind: 'parent' | 'child' | 'spouse' = isParentOfFrom ? 'parent' : isSpouseOfFrom ? 'spouse' : 'child'

          let relType: RelationType
          let computedLabel: string | undefined
          let isBroken = chainBroken.has(from) // propagate broken chain from parent

          // Check for embedded _relationType from our toFamilyChartData (survives round-trips)
          const embeddedRelType = datum.data._relationType as RelationType | undefined

          if (from === 'user') {
            if (isParentOfFrom) {
              relType = embeddedRelType || oldNode?.relationType || (gender === 'male' ? 'father' : 'mother')
            } else if (isSpouseOfFrom) {
              relType = embeddedRelType || oldNode?.relationType || (gender === 'male' ? 'husband' : 'wife')
            } else {
              relType = embeddedRelType || oldNode?.relationType || (gender === 'male' ? 'son' : 'daughter')
            }
          } else {
            const fromRelType = resolvedType.get(from)
            if (fromRelType) {
              let baseRel: 'father' | 'mother' | 'husband' | 'wife' | 'son' | 'daughter'
              if (isParentOfFrom) {
                baseRel = gender === 'male' ? 'father' : 'mother'
              } else if (isSpouseOfFrom) {
                baseRel = gender === 'male' ? 'husband' : 'wife'
              } else {
                baseRel = gender === 'male' ? 'son' : 'daughter'
              }
              const resolved = resolveRelation(fromRelType, baseRel, state.userGender!)

              if (embeddedRelType && embeddedRelType.includes('foster')) {
                // Preserve foster relation types — structural resolution would lose foster info
                // e.g. husband_foster_mother would become mother_in_law via resolveRelation('husband','mother')
                relType = embeddedRelType
              } else if (resolved) {
                relType = resolved

                // Compute descriptive label when type is reused from a different context
                if (resolved === fromRelType && baseRel !== 'wife' && baseRel !== 'husband') {
                  const resolvedOption = RELATION_OPTIONS.find(o => o.type === resolved)
                  const resolvedLabel = resolvedOption?.labelId || resolved
                  computedLabel = `Keluarga ${resolvedLabel} (${describeBaseRel(baseRel)})`
                }
              } else if (embeddedRelType) {
                relType = embeddedRelType
              } else if (oldNode?.relationType) {
                relType = oldNode.relationType
              } else {
                // Resolve chain broke — this relationship is unmapped
                // Use the base relation for structural purposes but mark chain as broken
                relType = baseRel
                isBroken = true

                // Generate a descriptive label instead of a misleading one like "Anak Perempuan"
                const fromOption = RELATION_OPTIONS.find(o => o.type === fromRelType)
                const fromLabel = fromOption?.labelId || fromRelType
                computedLabel = `${describeBaseRel(baseRel)} dari ${fromLabel}`
              }
            } else {
              relType = embeddedRelType || oldNode?.relationType || (gender === 'male' ? 'son' : 'daughter')
            }
          }

          if (isBroken) chainBroken.add(id)

          resolvedType.set(id, relType)
          const option = RELATION_OPTIONS.find(o => o.type === relType)

          // For broken-chain nodes, use the descriptive label as the default name
          const defaultName = computedLabel || option?.labelId || relType

          nodes.push({
            id,
            name: datum.data['first name'] || oldNode?.name || defaultName,
            gender,
            relationType: relType,
            relationLabel: computedLabel,
            avatarSeed: oldNode?.avatarSeed,
            x: oldNode?.x || 0,
            y: oldNode?.y || 0,
            layer: option?.layer || 0,
          })

          // For broken-chain nodes, force bukan_mahram instead of using checkMahram
          // which would give wrong results for the fallback relationType
          const mahramResult = isBroken
            ? BUKAN_MAHRAM
            : checkMahram(state.userGender, relType)

          edges.push({
            id: `edge-${++edgeIdx}`,
            fromId: from,
            toId: id,
            relationType: relType,
            mahramResult,
            edgeKind,
          })

          // Enqueue this node's relations
          enqueue(datum.rels.parents || [], id)
          enqueue(datum.rels.spouses || [], id)
          enqueue(datum.rels.children || [], id)
        }

        set({ nodes, edges })
      },

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
          userAvatarSeed: '',
        })
      },
    }),
    {
      name: 'mahrom-app-store',
    }
  )
)
