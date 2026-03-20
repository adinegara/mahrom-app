import type { PersonNode, RelationEdge } from './types'
import { isSpouseResolution } from './resolve'

/**
 * Spacing constants matching family-chart style.
 * COUPLE_GAP: center-to-center distance between spouses (tight, side-by-side).
 * NODE_SPACING: minimum center-to-center distance between separate family units.
 * LAYER_HEIGHT: vertical distance between generations.
 */
const COUPLE_GAP = 175
const NODE_SPACING = 250
const LAYER_HEIGHT = 180

/**
 * Recalculates x,y positions for all nodes using a recursive subtree-width
 * algorithm. Couples are placed side-by-side; children are centered under
 * the couple midpoint. User is treated as the root at (0,0).
 */
export function calculateTreeLayout(nodes: PersonNode[], edges: RelationEdge[]): PersonNode[] {
  if (nodes.length === 0) return nodes

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // --- Classify edges as spouse or parent→child ---
  const spouseOf = new Map<string, string>()
  const childrenOf = new Map<string, string[]>()

  for (const edge of edges) {
    const fromNode = edge.fromId !== 'user' ? nodeMap.get(edge.fromId) : null
    const isSpouse =
      edge.relationType === 'husband' || edge.relationType === 'wife' ||
      (fromNode != null && isSpouseResolution(fromNode.relationType, edge.relationType))

    if (isSpouse) {
      if (!spouseOf.has(edge.fromId)) {
        spouseOf.set(edge.fromId, edge.toId)
        spouseOf.set(edge.toId, edge.fromId)
      }
    } else {
      const children = childrenOf.get(edge.fromId) || []
      children.push(edge.toId)
      childrenOf.set(edge.fromId, children)
    }
  }

  // --- Helpers ---

  /** Get all non-spouse children of a family unit (node + its spouse). */
  function getUnitChildren(nodeId: string): string[] {
    const kids = [...(childrenOf.get(nodeId) || [])]
    const sp = spouseOf.get(nodeId)
    if (sp) kids.push(...(childrenOf.get(sp) || []))
    return kids
  }

  /** Compute horizontal space needed for a subtree rooted at a family unit. */
  const widthCache = new Map<string, number>()
  function subtreeWidth(nodeId: string): number {
    if (widthCache.has(nodeId)) return widthCache.get(nodeId)!

    const hasSpouse = spouseOf.has(nodeId)
    const selfWidth = hasSpouse ? COUPLE_GAP : NODE_SPACING * 0.6

    const children = getUnitChildren(nodeId)
    if (children.length === 0) {
      const w = Math.max(NODE_SPACING, selfWidth)
      widthCache.set(nodeId, w)
      return w
    }

    let totalChildWidth = 0
    for (const childId of children) {
      totalChildWidth += subtreeWidth(childId)
    }

    const w = Math.max(selfWidth, totalChildWidth)
    widthCache.set(nodeId, w)
    return w
  }

  // --- Layout pass ---

  const positions = new Map<string, { x: number; y: number }>()

  /**
   * Layout a family unit (node + optional spouse) centered at cx.
   * Recursively lays out children below.
   */
  function layoutUnit(nodeId: string, cx: number) {
    if (positions.has(nodeId)) return

    const node = nodeMap.get(nodeId)
    const sp = spouseOf.get(nodeId)
    const y = nodeId === 'user' ? 0 : (node?.layer ?? 0) * LAYER_HEIGHT

    // Place node and spouse
    if (sp && !positions.has(sp)) {
      const halfGap = COUPLE_GAP / 2

      // Determine gender: for user, infer from spouse's gender
      let isMale: boolean
      if (nodeId === 'user') {
        const spNode = nodeMap.get(sp)
        isMale = !spNode || spNode.gender === 'female'
      } else {
        isMale = node?.gender === 'male'
      }

      if (isMale) {
        positions.set(nodeId, { x: cx - halfGap, y })
        positions.set(sp, { x: cx + halfGap, y })
      } else {
        positions.set(nodeId, { x: cx + halfGap, y })
        positions.set(sp, { x: cx - halfGap, y })
      }
    } else {
      positions.set(nodeId, { x: cx, y })
    }

    // Layout children centered under the couple midpoint (= cx)
    const children = getUnitChildren(nodeId)
    if (children.length === 0) return

    const childWidths = children.map(id => ({ id, width: subtreeWidth(id) }))
    const totalWidth = childWidths.reduce((sum, c) => sum + c.width, 0)
    let x = cx - totalWidth / 2

    for (const cw of childWidths) {
      layoutUnit(cw.id, x + cw.width / 2)
      x += cw.width
    }
  }

  // Start layout from user
  layoutUnit('user', 0)

  // --- Post-process: shift everything so user stays at (0,0) ---
  const userPos = positions.get('user') || { x: 0, y: 0 }
  const shiftX = -userPos.x
  const shiftY = -userPos.y

  return nodes.map(node => {
    const p = positions.get(node.id)
    if (p) {
      return { ...node, x: p.x + shiftX, y: p.y + shiftY }
    }
    return node
  })
}
