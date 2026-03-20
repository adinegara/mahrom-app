import { useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import * as d3 from 'd3'
import f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'
import { useAppStore } from '@/store'
import type { ChartDatum } from '@/store'
import { isSpouseResolution, resolveFosterRelation } from '@/lib/resolve'
import { checkMahram } from '@/lib/mahram'
import { getAvatarUrl } from '@/lib/avatar'
import { RELATION_OPTIONS, isFosterRelation, type RelationType } from '@/lib/types'
import type { PersonNode, RelationEdge, Gender } from '@/lib/types'
import { AvatarEditor } from './AvatarEditor'

interface AddRelationPopup {
  nodeId: string
  nodeType: string | null
  x: number
  y: number
}

interface F3Datum {
  id: string
  data: { gender: 'M' | 'F'; 'first name': string; [key: string]: unknown }
  rels: { parents: string[]; spouses: string[]; children: string[] }
}

function toFamilyChartData(
  nodes: PersonNode[],
  edges: RelationEdge[],
  userGender: Gender,
  userName: string,
  userAvatarSeed: string,
): F3Datum[] {
  const childrenOf = new Map<string, string[]>()
  const parentsOf = new Map<string, string[]>()
  const spousesOf = new Map<string, string[]>()

  for (const edge of edges) {
    const option = RELATION_OPTIONS.find(o => o.type === edge.relationType)
    if (!option) continue

    const fromNode = edge.fromId === 'user' ? null : nodes.find(n => n.id === edge.fromId)
    const fromRelType = fromNode?.relationType

    const isSpouse =
      edge.relationType === 'wife' ||
      edge.relationType === 'husband' ||
      (fromRelType && isSpouseResolution(fromRelType, edge.relationType))

    if (isSpouse) {
      if (!spousesOf.has(edge.fromId)) spousesOf.set(edge.fromId, [])
      if (!spousesOf.has(edge.toId)) spousesOf.set(edge.toId, [])
      spousesOf.get(edge.fromId)!.push(edge.toId)
      spousesOf.get(edge.toId)!.push(edge.fromId)
    } else {
      // Use edgeKind (from BFS context) when available, fall back to type direction
      const isUpward = edge.edgeKind ? edge.edgeKind === 'parent' : option.direction === 'up'
      if (isUpward) {
        if (!parentsOf.has(edge.fromId)) parentsOf.set(edge.fromId, [])
        parentsOf.get(edge.fromId)!.push(edge.toId)
        if (!childrenOf.has(edge.toId)) childrenOf.set(edge.toId, [])
        childrenOf.get(edge.toId)!.push(edge.fromId)
      } else {
        if (!childrenOf.has(edge.fromId)) childrenOf.set(edge.fromId, [])
        childrenOf.get(edge.fromId)!.push(edge.toId)
        if (!parentsOf.has(edge.toId)) parentsOf.set(edge.toId, [])
        parentsOf.get(edge.toId)!.push(edge.fromId)
      }
    }
  }

  // Pair co-parents as spouses when their relation types indicate a couple
  // (needed when a child has 3+ parents, e.g. father + mother + foster_mother)
  for (const [, parentIds] of parentsOf.entries()) {
    if (parentIds.length < 2) continue
    for (let i = 0; i < parentIds.length; i++) {
      for (let j = i + 1; j < parentIds.length; j++) {
        const p1Id = parentIds[i]
        const p2Id = parentIds[j]
        if (spousesOf.get(p1Id)?.includes(p2Id)) continue
        const p1Node = p1Id === 'user' ? null : nodes.find(n => n.id === p1Id)
        const p2Node = p2Id === 'user' ? null : nodes.find(n => n.id === p2Id)
        if (!p1Node || !p2Node) continue
        if (p1Node.gender === p2Node.gender) continue
        if (isSpouseResolution(p1Node.relationType, p2Node.relationType) ||
            isSpouseResolution(p2Node.relationType, p1Node.relationType)) {
          if (!spousesOf.has(p1Id)) spousesOf.set(p1Id, [])
          if (!spousesOf.has(p2Id)) spousesOf.set(p2Id, [])
          spousesOf.get(p1Id)!.push(p2Id)
          spousesOf.get(p2Id)!.push(p1Id)
        }
      }
    }
  }

  const data: F3Datum[] = []

  data.push({
    id: 'user',
    data: {
      gender: userGender === 'male' ? 'M' : 'F',
      'first name': userName || 'Saya',
      avatar: getAvatarUrl(userName || 'Saya', userGender, userAvatarSeed || undefined),
      mahram: '',
      mahramReason: '',
      mahramCondition: '',
      mahramCategory: '',
    },
    rels: {
      parents: parentsOf.get('user') || [],
      spouses: spousesOf.get('user') || [],
      children: childrenOf.get('user') || [],
    },
  })

  // Build a lookup from node ID → edge mahramResult (which correctly handles chain breaks)
  const edgeMahramMap = new Map<string, RelationEdge>()
  for (const edge of edges) {
    edgeMahramMap.set(edge.toId, edge)
  }

  for (const node of nodes) {
    // Use the edge's stored mahramResult (accounts for chain breaks) instead of recomputing
    const edge = edgeMahramMap.get(node.id)
    const mahramResult = edge?.mahramResult ?? checkMahram(userGender, node.relationType)
    const isSameGender = node.gender === userGender

    let mahramLabel: string
    let mahramReason = ''
    let mahramCondition = ''
    let mahramCategory = ''

    if (isSameGender) {
      mahramLabel = ''
    } else {
      mahramLabel = mahramResult.label
      // Use relationLabel for reason when available (computed from tree path)
      if (node.relationLabel) {
        mahramReason = `${node.relationLabel} - ${mahramResult.category === 'mahram_pernikahan' ? 'mahram selamanya, cukup dengan akad nikah' : mahramResult.reason}`
      } else {
        mahramReason = mahramResult.reason
      }
      mahramCondition = mahramResult.condition || ''
      mahramCategory = mahramResult.category
    }

    data.push({
      id: node.id,
      data: {
        gender: node.gender === 'male' ? 'M' : 'F',
        'first name': node.name,
        avatar: getAvatarUrl(`${node.name}-${node.relationType}`, node.gender, node.avatarSeed),
        _relationType: node.relationType,
        mahram: mahramLabel,
        mahramReason,
        mahramCondition,
        mahramCategory,
      },
      rels: {
        parents: parentsOf.get(node.id) || [],
        spouses: spousesOf.get(node.id) || [],
        children: childrenOf.get(node.id) || [],
      },
    })
  }

  return data
}

function styleFosterLinks(container: HTMLElement) {
  const { edges } = useAppStore.getState()
  // Build a set of node-id pairs that are foster relations
  const fosterPairs = new Set<string>()
  for (const edge of edges) {
    if (isFosterRelation(edge.relationType)) {
      fosterPairs.add(`${edge.fromId}|${edge.toId}`)
      fosterPairs.add(`${edge.toId}|${edge.fromId}`)
    }
  }

  // Query all link paths rendered by family-chart
  const paths = container.querySelectorAll('path.link')
  paths.forEach((path) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (path as any).__data__
    if (!d || !d.source || !d.target) return
    const sourceId = d.source.data?.id || d.source.id
    const targetId = d.target.data?.id || d.target.id
    if (!sourceId || !targetId) return

    if (fosterPairs.has(`${sourceId}|${targetId}`)) {
      path.classList.add('f3-foster-link')
    } else {
      path.classList.remove('f3-foster-link')
    }
  })
}

// IDs for injected ghost datums
const FOSTER_GHOST_PREFIX = '_foster_ghost_'
const BIO_GHOST_FATHER = '_bio_father_ghost'
const BIO_GHOST_MOTHER = '_bio_mother_ghost'

export function FamilyChartCanvas() {
  const contRef = useRef<HTMLDivElement>(null)
  const [chartKey, setChartKey] = useState(0)
  const [addPopup, setAddPopup] = useState<AddRelationPopup | null>(null)
  const chartKeyRef = useRef(setChartKey)
  chartKeyRef.current = setChartKey
  const avatarEditorRootRef = useRef<Root | null>(null)

  useEffect(() => {
    const el = contRef.current
    if (!el) return

    const { nodes, edges, userGender, userName, userAvatarSeed, syncFromTreeData } = useAppStore.getState()
    if (!userGender) return

    const data = toFamilyChartData(nodes, edges, userGender, userName, userAvatarSeed)
    if (data.length === 0) return

    const f3Chart = f3.createChart(el, data)
      .setTransitionTime(1000)
      .setCardXSpacing(300)
      .setCardYSpacing(200)
      .setOrientationVertical()
      .setShowSiblingsOfMain(true)
      .setSingleParentEmptyCard(false, { label: '' })

    const f3Card = f3Chart.setCardHtml()
      .setCardDisplay([['first name']])
      .setCardDim({})
      .setMiniTree(true)
      .setStyle('imageCircle')
      .setOnHoverPathToMain()

    /**
     * Inject foster ghost datums into family-chart's store after
     * add-relative creates the normal ghost cards for the user node.
     */
    function injectFosterGhosts() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storeData: any[] = (f3Chart as any).store.getData()
      const userDatum = storeData.find((d: any) => d.id === 'user')
      if (!userDatum) return

      // Don't double-inject
      if (storeData.some((d: any) => d.id.startsWith(FOSTER_GHOST_PREFIX))) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fosterMother: any = {
        id: FOSTER_GHOST_PREFIX + 'mother',
        data: { gender: 'F', 'first name': '' },
        rels: { parents: [], spouses: [], children: ['user'] },
        _new_rel_data: { rel_type: 'mother', label: 'Ibu Susuan', rel_id: 'user', _foster: true },
      }

      storeData.push(fosterMother)
      userDatum.rels.parents.push(FOSTER_GHOST_PREFIX + 'mother')

      f3Chart.updateTree({ initial: false })
    }

    /**
     * Inject biological parent ghost cards ONLY when foster parents already
     * fill both parent slots, blocking the library's built-in "add parent".
     */
    function injectBiologicalParentGhosts() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storeData: any[] = (f3Chart as any).store.getData()
      const userDatum = storeData.find((d: any) => d.id === 'user')
      if (!userDatum) return

      const { nodes: currentNodes } = useAppStore.getState()
      const hasBioFather = currentNodes.some(n => n.relationType === 'father')
      const hasBioMother = currentNodes.some(n => n.relationType === 'mother')
      if (hasBioFather && hasBioMother) return

      // Only inject when the user already has 2 real (non-ghost) parents in f3's data
      // (meaning foster parents filled both slots and the library won't show its own ghost parents)
      const realParentCount = (userDatum.rels.parents || []).filter(
        (pid: string) => {
          if (pid.startsWith(FOSTER_GHOST_PREFIX) || pid === BIO_GHOST_FATHER || pid === BIO_GHOST_MOTHER) return false
          // Also exclude library-generated ghost datums
          const d = storeData.find((dd: any) => dd.id === pid)
          if (d && d._new_rel_data) return false
          return true
        }
      ).length
      if (realParentCount < 2) return

      // Don't double-inject
      if (storeData.some((d: any) => d.id === BIO_GHOST_FATHER || d.id === BIO_GHOST_MOTHER)) return

      if (!hasBioFather) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ghost: any = {
          id: BIO_GHOST_FATHER,
          data: { gender: 'M', 'first name': '' },
          rels: { parents: [], spouses: [], children: ['user'] },
          _new_rel_data: { rel_type: 'father', label: 'Bapak', rel_id: 'user', _bio: true },
        }
        storeData.push(ghost)
        userDatum.rels.parents.push(BIO_GHOST_FATHER)
      }

      if (!hasBioMother) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ghost: any = {
          id: BIO_GHOST_MOTHER,
          data: { gender: 'F', 'first name': '' },
          rels: { parents: [], spouses: [], children: ['user'] },
          _new_rel_data: { rel_type: 'mother', label: 'Ibu', rel_id: 'user', _bio: true },
        }
        storeData.push(ghost)
        userDatum.rels.parents.push(BIO_GHOST_MOTHER)
      }

      f3Chart.updateTree({ initial: false })
    }

    // Custom card update: add mahram badge + edit/add icons on each card
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    f3Card.setOnCardUpdate(function (this: Element, d: any) {
      if (d.data._new_rel_data) {
        // Style foster ghost cards with blue border
        if (d.data._new_rel_data._foster) {
          const inner = this.querySelector('.card-inner') as HTMLElement | null
          if (inner) {
            inner.style.borderColor = '#2563eb'
            inner.style.borderStyle = 'dashed'
            inner.style.background = '#eff6ff'
          }
        }
        // Style biological parent ghost cards with green border
        if (d.data._new_rel_data._bio) {
          const inner = this.querySelector('.card-inner') as HTMLElement | null
          if (inner) {
            inner.style.borderColor = '#16a34a'
            inner.style.borderStyle = 'dashed'
            inner.style.background = '#f0fdf4'
          }
        }
        return
      }
      if (f3EditTree.isRemovingRelative()) return

      d3.select(this).select('.card').style('cursor', 'default')
      const cardEl = this.querySelector('.card')
      const card = this.querySelector('.card-inner')

      // Mahram badge — appended to .card (outside .card-inner circle)
      const mahram = d.data.data?.mahram || ''
      const reason = d.data.data?.mahramReason || ''
      const condition = d.data.data?.mahramCondition || ''
      const category = d.data.data?.mahramCategory || ''

      if (mahram && cardEl) {
        let bgColor: string
        let textColor: string
        switch (category) {
          case 'mahram_nasab':
            bgColor = '#dcfce7'; textColor = '#166534'; break
          case 'mahram_susuan':
            bgColor = '#dbeafe'; textColor = '#1e40af'; break
          case 'mahram_pernikahan':
            bgColor = '#f3e8ff'; textColor = '#6b21a8'; break
          case 'mahram_sementara':
            bgColor = '#fef9c3'; textColor = '#854d0e'; break
          case 'bukan_mahram':
            bgColor = '#fee2e2'; textColor = '#991b1b'; break
          default: {
            const gender = d.data.data.gender
            bgColor = gender === 'M' ? '#e8f0fe' : '#fde8ef'
            textColor = gender === 'M' ? '#1565c0' : '#be185d'
            break
          }
        }

        // Get the card-label height to position badge below it
        const labelEl = (cardEl as HTMLElement).querySelector('.card-label')
        const labelHeight = labelEl ? labelEl.getBoundingClientRect().height : 14

        const badge = d3.select(cardEl)
          .append('div')
          .attr('style', `
            position:absolute;top:100%;left:50%;
            transform:translateX(-50%);
            margin-top:${labelHeight + 12}px;
            padding:4px 6px;border-radius:6px;
            background:${bgColor};font-size:10px;line-height:1.3;
            color:${textColor};text-align:center;
            width:max-content;max-width:200px;
          `)

        badge.append('div')
          .attr('style', 'font-weight:700;font-size:10px;')
          .text(mahram)

        if (reason) {
          badge.append('div')
            .attr('style', 'font-weight:400;font-size:9px;opacity:0.85;margin-top:2px;')
            .text(reason)
        }

        if (condition) {
          badge.append('div')
            .attr('style', `
              font-weight:600;font-size:9px;margin-top:3px;
              padding:2px 4px;border-radius:4px;
              background:rgba(0,0,0,0.08);
            `)
            .text(condition)
        }
      }

      // Foster (Susuan) indicator badge
      const nodeId = d.data.id
      if (nodeId && nodeId !== 'user' && cardEl) {
        const { edges: currentEdges } = useAppStore.getState()
        const nodeEdge = currentEdges.find((e: RelationEdge) => e.toId === nodeId)
        if (nodeEdge && isFosterRelation(nodeEdge.relationType)) {
          d3.select(cardEl)
            .append('div')
            .attr('style', `
              position:absolute;top:-8px;left:50%;
              transform:translateX(-50%);
              padding:2px 6px;border-radius:4px;
              background:#2563eb;color:#fff;
              font-size:9px;font-weight:600;
              white-space:nowrap;
            `)
            .text('Susuan')
        }
      }

      // Edit icon (top-right)
      d3.select(card)
        .append('div')
        .attr('class', 'f3-svg-circle-hover')
        .attr('style', 'cursor:pointer;width:20px;height:20px;position:absolute;top:0;right:0;')
        .html(f3.icons.userEditSvgIcon())
        .select('svg')
        .style('padding', '0')
        .on('click', (e: MouseEvent) => {
          e.stopPropagation()
          if (f3EditTree.isAddingRelative()) return
          if (f3EditTree.isRemovingRelative()) return
          f3EditTree.open(d.data)
        })

      // Add-relative icon (next to edit)
      d3.select(card)
        .append('div')
        .attr('class', 'f3-svg-circle-hover')
        .attr('style', 'cursor:pointer;width:20px;height:20px;position:absolute;top:0;right:23px;')
        .html(f3.icons.userPlusSvgIcon())
        .select('svg')
        .style('padding', '0')
        .on('click', (e: MouseEvent) => {
          e.stopPropagation()

          const isMain = (f3Chart as any).store.getMainDatum()?.id === d.data.id
          const nodeId = d.data.id

          // Toggle add-relative mode (shows ghost cards) with form
          if (f3EditTree.isAddingRelative()) {
            f3EditTree.addRelativeInstance?.onCancel()
          } else if (isMain) {
            f3EditTree.open(d.data)
            document.querySelector<HTMLElement>('.f3-add-relative-btn')?.click()
          } else {
            f3Card.onCardClickDefault(e, d)
            setTimeout(() => {
              f3EditTree.open(d.data)
              document.querySelector<HTMLElement>('.f3-add-relative-btn')?.click()
            }, 1100)
          }

          if (nodeId === 'user') {
            setTimeout(() => {
              injectFosterGhosts()
              injectBiologicalParentGhosts()
            }, isMain ? 200 : 1300)
          }
        })
    })

    // Mode-aware card click handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    f3Card.setOnCardClick((e: MouseEvent, d: any) => {
      if (f3EditTree.isAddingRelative()) {
        if (d.data._new_rel_data) {
          // Ghost card click — use library's built-in add behavior
          f3EditTree.open(d.data)
        } else {
          f3EditTree.addRelativeInstance?.onCancel()
          f3EditTree.closeForm()
          f3Card.onCardClickDefault(e, d)
        }
      } else if (f3EditTree.isRemovingRelative()) {
        f3EditTree.open(d.data)
      } else {
        // Click any regular card → re-layout tree around this node, don't open form
        f3Card.onCardClickDefault(e, d)
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updatingMahram = false
    const f3EditTree = (f3Chart.editTree() as any)
      .fixed(true)
      .setFields(['first name'])
      .setEditFirst(true)
      .setOnFormCreation(({ cont, form_creator }: { cont: HTMLElement; form_creator: { datum_id: string; new_rel?: boolean } }) => {
        // Always hide gender radio — it's auto-filled
        const genderRadio = cont.querySelector<HTMLElement>('.f3-radio-group')
        if (genderRadio) genderRadio.style.display = 'none'

        // Rename "first name" label to "Nama" on all forms
        cont.querySelectorAll<HTMLElement>('label').forEach(label => {
          if (label.textContent?.trim().toLowerCase() === 'first name') {
            label.textContent = 'Nama'
          }
        })

        // Don't show avatar editor for new relation forms
        if (form_creator.new_rel) return

        const nodeId: string = form_creator.datum_id
        if (!nodeId) return

        // --- Hide edit, submit, remove-relative, add-relative buttons + gender radio ---
        const hideSelectors = [
          '.f3-edit-btn',
          '.f3-remove-relative-btn',
          '.f3-add-relative-btn',
          '.f3-cancel-btn',
          'button[type="submit"]',
          '.f3-radio-group',
        ]
        for (const sel of hideSelectors) {
          const btn = cont.querySelector<HTMLElement>(sel)
          if (btn) btn.style.display = 'none'
        }
        // Hide submit buttons inside form (but keep delete button)
        const formEl = cont.querySelector('form')
        if (formEl) {
          formEl.querySelectorAll<HTMLElement>('button').forEach(btn => {
            if (btn.classList.contains('f3-delete-btn')) return
            btn.style.display = 'none'
          })
        }

        // --- Add close (X) button ---
        const closeBtn = document.createElement('button')
        closeBtn.type = 'button'
        closeBtn.textContent = '\u00d7'
        closeBtn.setAttribute('style', `
          position:absolute;top:8px;right:8px;
          background:none;border:2px solid var(--color-doodle-border, #d4d4d4);
          font-family:var(--font-sans, Open Sans, sans-serif);
          font-size:24px;font-weight:700;
          cursor:pointer;color:var(--color-ink-light, #6b6b6b);line-height:1;
          padding:2px 10px;border-radius:10px;z-index:10;
          box-shadow:2px 2px 0px var(--color-doodle-border, #d4d4d4);
          transition:all 0.2s;
        `)
        closeBtn.addEventListener('mouseenter', () => {
          closeBtn.style.color = 'var(--color-ink, #2d2d2d)'
          closeBtn.style.borderColor = 'var(--color-ink, #2d2d2d)'
          closeBtn.style.boxShadow = '3px 3px 0px var(--color-ink, #2d2d2d)'
        })
        closeBtn.addEventListener('mouseleave', () => {
          closeBtn.style.color = 'var(--color-ink-light, #6b6b6b)'
          closeBtn.style.borderColor = 'var(--color-doodle-border, #d4d4d4)'
          closeBtn.style.boxShadow = '2px 2px 0px var(--color-doodle-border, #d4d4d4)'
        })
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          f3EditTree.closeForm()
        })
        cont.style.position = 'relative'
        cont.prepend(closeBtn)


        // --- Debounced auto-save on input (without triggering tree re-render) ---
        let debounceTimer: ReturnType<typeof setTimeout> | null = null
        const nameInput = cont.querySelector<HTMLInputElement>('input[name="first name"], input[type="text"]')
        if (nameInput) {
          nameInput.addEventListener('input', () => {
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
              // Update f3's internal data directly
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sd: F3Datum[] = (f3Chart as any).store.getData()
              const datum = sd.find((d: F3Datum) => d.id === nodeId)
              if (datum) {
                datum.data['first name'] = nameInput.value
              }
              // Sync to app store without re-rendering the tree
              const exported = f3EditTree.exportData() as ChartDatum[]
              syncFromTreeData(exported)
            }, 500)
          })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storeData: F3Datum[] = (f3Chart as any).store.getData()
        const chartDatum = storeData.find((d: F3Datum) => d.id === nodeId)
        const nodeGender: Gender = chartDatum?.data?.gender === 'M' ? 'male' : 'female'

        const { nodes: sNodes, userAvatarSeed, userName: uName } = useAppStore.getState()
        const node = sNodes.find((n: PersonNode) => n.id === nodeId)
        const currentData = nodeId === 'user'
          ? (userAvatarSeed || uName || 'Saya')
          : (node?.avatarSeed || `${node?.name}-${node?.relationType}`)

        // Create a container for the avatar editor in the sidebar form
        const editorContainer = document.createElement('div')
        editorContainer.className = 'f3-avatar-editor-container'
        editorContainer.style.padding = '8px 12px'
        // Prevent clicks inside the editor from bubbling to the f3 form (which would trigger submit)
        editorContainer.addEventListener('click', (e) => e.stopPropagation())
        editorContainer.addEventListener('submit', (e) => e.preventDefault())

        // Insert AFTER the form element (not inside it) to avoid form submission issues
        const form = cont.querySelector('form')
        if (form) {
          form.after(editorContainer)
        } else {
          cont.appendChild(editorContainer)
        }

        // Unmount previous React root if any
        if (avatarEditorRootRef.current) {
          avatarEditorRootRef.current.unmount()
          avatarEditorRootRef.current = null
        }

        // Mount the AvatarEditor via React portal
        const root = createRoot(editorContainer)
        avatarEditorRootRef.current = root
        root.render(
          <AvatarEditor
            nodeId={nodeId}
            gender={nodeGender}
            currentData={currentData}
            onUpdate={(optionsJson: string) => {
              // Update the store
              useAppStore.getState().updateAvatarSeed(nodeId, optionsJson)
              // Update f3's internal data with new avatar URL (visual update on next tree render)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sd: F3Datum[] = (f3Chart as any).store.getData()
              const datum = sd.find((d: F3Datum) => d.id === nodeId)
              if (datum) {
                const g: Gender = datum.data.gender === 'M' ? 'male' : 'female'
                const defaultSeed = nodeId === 'user'
                  ? (uName || 'Saya')
                  : `${datum.data['first name']}-${(datum.data as Record<string, unknown>)._relationType || ''}`
                datum.data.avatar = getAvatarUrl(defaultSeed, g, optionsJson)
              }
              // Don't call updateTree here — it would destroy the form + our React root.
              // The card image updates when the form is closed/submitted or tree re-renders.
              // Instead, try to update the card image directly in the DOM.
              try {
                const allCardConts = el.querySelectorAll('.card_cont')
                allCardConts.forEach((cardCont) => {
                  // d3 binds data to __data__ property
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const bound = (cardCont as any).__data__
                  if (bound?.data?.id === nodeId) {
                    const img = cardCont.querySelector('.card-inner img') as HTMLImageElement | null
                    if (img && datum) {
                      img.src = datum.data.avatar as string
                    }
                  }
                })
              } catch (_) { /* best effort */ }
            }}
          />
        )
      })
      .setOnChange(() => {
        const exported = f3EditTree.exportData() as ChartDatum[]
        syncFromTreeData(exported)

        // Auto-close the form after submit
        setTimeout(() => f3EditTree.closeForm(), 100)

        // After store is updated with correct relation types + mahram,
        // push mahram labels back into family-chart's internal data and re-render.
        if (updatingMahram) return
        updatingMahram = true

        const { nodes: updatedNodes, edges: updatedEdges, userGender: ug } = useAppStore.getState()
        if (ug) {
          // Build edge lookup for stored mahramResult (handles chain breaks correctly)
          const edgeLookup = new Map<string, RelationEdge>()
          for (const edge of updatedEdges) {
            edgeLookup.set(edge.toId, edge)
          }

          // Access family-chart's internal data directly
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const storeData: F3Datum[] = (f3Chart as any).store.getData()
          for (const datum of storeData) {
            if (datum.id === 'user') continue
            const node = updatedNodes.find((n: PersonNode) => n.id === datum.id)
            if (!node) continue
            // Use edge's stored mahramResult (accounts for chain breaks)
            const edge = edgeLookup.get(node.id)
            const mahramResult = edge?.mahramResult ?? checkMahram(ug, node.relationType)
            const isSameGender = node.gender === ug
            datum.data.mahram = isSameGender ? '' : mahramResult.label
            datum.data.mahramReason = isSameGender ? '' : (
              node.relationLabel
                ? `${node.relationLabel} - ${mahramResult.category === 'mahram_pernikahan' ? 'mahram selamanya, cukup dengan akad nikah' : mahramResult.reason}`
                : mahramResult.reason
            )
            datum.data.mahramCondition = isSameGender ? '' : (mahramResult.condition || '')
            datum.data.mahramCategory = isSameGender ? '' : mahramResult.category
          }
          f3Chart.updateTree({ initial: false, tree_position: 'inherit' })
          setTimeout(() => styleFosterLinks(el), 100)
        }

        updatingMahram = false
      })

    f3EditTree.setEdit()

    f3Chart.updateTree({ initial: true })

    // Style foster links after initial render (wait for transition)
    setTimeout(() => styleFosterLinks(el), 100)

    return () => {
      if (avatarEditorRootRef.current) {
        avatarEditorRootRef.current.unmount()
        avatarEditorRootRef.current = null
      }
      el.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartKey])

  const userGender = useAppStore(s => s.userGender)
  const addRelation = useAppStore(s => s.addRelation)
  const addRelationToNode = useAppStore(s => s.addRelationToNode)

  const getRelationOptions = (nodeId: string, nodeType: string | null) => {
    const options: { type: RelationType; label: string; gender: 'male' | 'female'; isFoster: boolean }[] = []

    if (nodeId === 'user' || !nodeType) {
      // User node - show basic relations
      options.push(
        { type: 'father', label: 'Bapak', gender: 'male', isFoster: false },
        { type: 'mother', label: 'Ibu', gender: 'female', isFoster: false },
        { type: 'foster_father', label: 'Bapak Susuan', gender: 'male', isFoster: true },
        { type: 'foster_mother', label: 'Ibu Susuan', gender: 'female', isFoster: true },
        { type: 'son', label: 'Anak Laki-laki', gender: 'male', isFoster: false },
        { type: 'daughter', label: 'Anak Perempuan', gender: 'female', isFoster: false },
        { type: 'foster_son', label: 'Anak Susuan (lk)', gender: 'male', isFoster: true },
        { type: 'foster_daughter', label: 'Anak Susuan (pr)', gender: 'female', isFoster: true },
      )
      if (userGender === 'female') {
        options.push({ type: 'husband', label: 'Suami', gender: 'male', isFoster: false })
      } else {
        options.push({ type: 'wife', label: 'Istri', gender: 'female', isFoster: false })
      }
    } else {
      // Non-user node - resolve relations based on node type
      const isSpouseType = nodeType === 'wife' || nodeType === 'husband'

      // Parents
      options.push(
        { type: 'father', label: 'Bapak', gender: 'male', isFoster: false },
        { type: 'mother', label: 'Ibu', gender: 'female', isFoster: false },
        { type: 'foster_father', label: 'Bapak Susuan', gender: 'male', isFoster: true },
        { type: 'foster_mother', label: 'Ibu Susuan', gender: 'female', isFoster: true },
      )

      // Children
      options.push(
        { type: 'son', label: 'Anak Laki-laki', gender: 'male', isFoster: false },
        { type: 'daughter', label: 'Anak Perempuan', gender: 'female', isFoster: false },
        { type: 'foster_son', label: 'Anak Susuan (lk)', gender: 'male', isFoster: true },
        { type: 'foster_daughter', label: 'Anak Susuan (pr)', gender: 'female', isFoster: true },
      )

      // Spouse for user
      if (nodeId === 'user') {
        if (userGender === 'female') {
          options.push({ type: 'husband', label: 'Suami', gender: 'male', isFoster: false })
        } else {
          options.push({ type: 'wife', label: 'Istri', gender: 'female', isFoster: false })
        }
      }

      // Foster siblings for spouse nodes
      if (isSpouseType) {
        const resolvedBrother = resolveFosterRelation(nodeType as RelationType, 'foster_brother')
        const resolvedSister = resolveFosterRelation(nodeType as RelationType, 'foster_sister')
        const brotherOpt = RELATION_OPTIONS.find(o => o.type === resolvedBrother)
        const sisterOpt = RELATION_OPTIONS.find(o => o.type === resolvedSister)
        if (brotherOpt) {
          options.push({ type: resolvedBrother, label: brotherOpt.labelId, gender: 'male', isFoster: true })
        }
        if (sisterOpt) {
          options.push({ type: resolvedSister, label: sisterOpt.labelId, gender: 'female', isFoster: true })
        }
      }
    }

    return options
  }

  const handleAddRelation = (type: RelationType) => {
    if (addPopup) {
      if (addPopup.nodeId === 'user') {
        addRelation(type)
      } else {
        addRelationToNode(addPopup.nodeId, type)
      }
      setAddPopup(null)
      chartKeyRef.current(k => k + 1)
    }
  }

  return (
    <div
      ref={contRef}
      id="FamilyChart"
      className="f3 relative"
      style={{ width: '100vw', height: '100vh', display: 'flex' }}
    >
      {/* Custom Add Relation Popup */}
      {addPopup && (
        <div
          className="fixed z-[100] w-[260px] bg-white rounded-2xl border-2 border-[var(--color-ink)]
            shadow-[4px_4px_0px_var(--color-ink)] overflow-hidden"
          style={{
            left: Math.min(addPopup.x, window.innerWidth - 280),
            top: addPopup.y,
          }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[var(--color-doodle-border)]">
            <span className="font-[var(--font-doodle)] text-sm font-bold text-[var(--color-ink)]">
              + Tambah Relasi
            </span>
            <button
              onClick={() => setAddPopup(null)}
              className="w-6 h-6 rounded-md border border-[var(--color-doodle-border)] flex items-center justify-center
                cursor-pointer hover:bg-gray-50 text-xs text-[var(--color-ink-light)]"
            >
              ✕
            </button>
          </div>

          <div className="p-2 max-h-[350px] overflow-y-auto space-y-1">
            {getRelationOptions(addPopup.nodeId, addPopup.nodeType).map(opt => (
              <button
                key={opt.type}
                onClick={() => handleAddRelation(opt.type)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer
                  transition-all hover:shadow-[2px_2px_0px] active:shadow-none text-left
                  ${opt.gender === 'male'
                    ? 'border-[var(--color-male)]/40 hover:bg-[var(--color-male-light)] hover:shadow-[var(--color-male)]'
                    : 'border-[var(--color-female)]/40 hover:bg-[var(--color-female-light)] hover:shadow-[var(--color-female)]'
                  }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0
                  ${opt.gender === 'male' ? 'bg-[var(--color-male)]' : 'bg-[var(--color-female)]'}`}>
                  {opt.gender === 'male' ? '♂' : '♀'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-[var(--font-doodle)] font-bold text-sm text-[var(--color-ink)]">
                      {opt.label}
                    </span>
                    {opt.isFoster && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-700">
                        SUSUAN
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
