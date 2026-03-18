import type { PersonNode, RelationEdge } from './types'

const LAYER_HEIGHT = 220
const NODE_SPACING = 220

/**
 * Recalculates x,y positions for all nodes in a tree layout.
 * User is at (0,0), layer 0. Parents at layer -1, grandparents -2, children +1, etc.
 * Nodes are grouped by their parent (fromId in edges) and layer.
 */
export function calculateTreeLayout(nodes: PersonNode[], edges: RelationEdge[]): PersonNode[] {
  if (nodes.length === 0) return nodes

  // Build adjacency: parentId -> child nodes
  const childrenOf = new Map<string, PersonNode[]>()
  const parentOf = new Map<string, string>() // nodeId -> parentId

  for (const edge of edges) {
    const node = nodes.find(n => n.id === edge.toId)
    if (!node) continue

    parentOf.set(node.id, edge.fromId)
    const siblings = childrenOf.get(edge.fromId) || []
    siblings.push(node)
    childrenOf.set(edge.fromId, siblings)
  }

  // Group all nodes by layer
  const layers = new Map<number, PersonNode[]>()
  for (const node of nodes) {
    const layerNodes = layers.get(node.layer) || []
    layerNodes.push(node)
    layers.set(node.layer, layerNodes)
  }

  // Position each node
  const positioned = new Map<string, { x: number; y: number }>()

  // Process layers from center outward
  const sortedLayers = [...layers.keys()].sort((a, b) => Math.abs(a) - Math.abs(b))

  for (const layer of sortedLayers) {
    const layerNodes = layers.get(layer)!
    const y = layer * LAYER_HEIGHT

    // Group nodes by their parent
    const byParent = new Map<string, PersonNode[]>()
    for (const node of layerNodes) {
      const pid = parentOf.get(node.id) || 'user'
      const group = byParent.get(pid) || []
      group.push(node)
      byParent.set(pid, group)
    }

    // Sort parent groups by parent x position
    const parentGroups = [...byParent.entries()].sort((a, b) => {
      const ax = a[0] === 'user' ? 0 : (positioned.get(a[0])?.x ?? 0)
      const bx = b[0] === 'user' ? 0 : (positioned.get(b[0])?.x ?? 0)
      return ax - bx
    })

    for (const [parentId, children] of parentGroups) {
      const parentX = parentId === 'user' ? 0 : (positioned.get(parentId)?.x ?? 0)
      const groupWidth = (children.length - 1) * NODE_SPACING
      const startX = parentX - groupWidth / 2

      for (let i = 0; i < children.length; i++) {
        const node = children[i]
        positioned.set(node.id, { x: startX + i * NODE_SPACING, y })
      }
    }

    // Resolve overlaps within the layer
    const allInLayer = layerNodes
      .map(n => ({ node: n, ...positioned.get(n.id)! }))
      .sort((a, b) => a.x - b.x)

    for (let i = 1; i < allInLayer.length; i++) {
      const prev = allInLayer[i - 1]
      const curr = allInLayer[i]
      if (curr.x - prev.x < NODE_SPACING) {
        const newX = prev.x + NODE_SPACING
        positioned.set(curr.node.id, { x: newX, y: curr.y })
        curr.x = newX
      }
    }

    // Re-center the layer
    if (allInLayer.length > 0) {
      const minX = allInLayer[0].x
      const maxX = allInLayer[allInLayer.length - 1].x
      const centerOffset = (minX + maxX) / 2

      // Only recenter if nodes don't have a specific parent anchor
      // Check if all nodes in layer share the same parent
      const parents = new Set(layerNodes.map(n => parentOf.get(n.id) || 'user'))
      if (parents.size === 1 && parents.has('user')) {
        for (const item of allInLayer) {
          const pos = positioned.get(item.node.id)!
          positioned.set(item.node.id, { x: pos.x - centerOffset, y: pos.y })
        }
      }
    }
  }

  // Apply positions to nodes
  return nodes.map(node => {
    const pos = positioned.get(node.id)
    if (pos) {
      return { ...node, x: pos.x, y: pos.y }
    }
    return node
  })
}
