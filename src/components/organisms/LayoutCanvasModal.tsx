import { useEffect, useRef, useState } from 'react'
import { GRID_COLS, type Block, type GridItem } from '../../types'
import Modal from '../atoms/Modal'
import { GripIcon, PlusIcon, TrashIcon } from '../atoms/icons'

interface Props {
  block: Block
  onClose: () => void
  onSave: (grid: GridItem[] | undefined) => void
}

// Visual 12-column layout for a custom block's fields. Drag a card to move it;
// drag the right edge to change how many columns it spans.
export default function LayoutCanvasModal({ block, onClose, onSave }: Props) {
  const [items, setItems] = useState<GridItem[]>(() => normalize(block.grid ?? []))
  const gridRef = useRef<HTMLDivElement>(null)

  // If the modal is reopened for a block that already has a saved layout, make
  // sure the canvas reflects it (covers the case where this component instance
  // is reused with a different block / grid).
  const gridKey = JSON.stringify(block.grid ?? [])
  const lastKey = useRef(gridKey)
  useEffect(() => {
    if (lastKey.current !== gridKey) {
      lastKey.current = gridKey
      setItems(normalize(block.grid ?? []))
    }
  }, [gridKey, block.grid])

  const labelOf = (id: string) => block.fields.find((f) => f.id === id)?.label ?? 'Field'
  const placed = new Set(items.map((i) => i.fieldId))
  const unplaced = block.fields.filter((f) => !placed.has(f.id))

  const colWidth = () => (gridRef.current ? gridRef.current.clientWidth / GRID_COLS : 60)

  const addToLayout = (fieldId: string) => {
    const isDate = block.fields.find((f) => f.id === fieldId)?.type === 'date'
    if (isDate) {
      // A date snaps to the right. If the last row has room, sit beside it;
      // otherwise start a new row, right-aligned.
      const lastY = items.length ? Math.max(...items.map((i) => i.y)) : 0
      const lastRow = items.filter((i) => i.y === lastY)
      const usedW = lastRow.reduce((s, i) => s + i.w, 0)
      const w = 4
      if (items.length && usedW + w <= GRID_COLS) {
        setItems((prev) => [...prev, { fieldId, x: GRID_COLS - w, y: lastY, w }])
      } else {
        const y = items.length ? lastY + 1 : 0
        setItems((prev) => [...prev, { fieldId, x: GRID_COLS - w, y, w }])
      }
      return
    }
    const y = items.length ? Math.max(...items.map((i) => i.y)) + 1 : 0
    setItems((prev) => [...prev, { fieldId, x: 0, y, w: GRID_COLS }])
  }
  const removeItem = (fieldId: string) => setItems((prev) => prev.filter((i) => i.fieldId !== fieldId))

  const startMove = (e: React.PointerEvent, item: GridItem) => {
    e.preventDefault()
    const cw = colWidth()
    const rowH = 46
    const sx = e.clientX
    const sy = e.clientY
    const o = { ...item }
    const onMove = (ev: PointerEvent) => {
      const x = clamp(o.x + Math.round((ev.clientX - sx) / cw), 0, GRID_COLS - o.w)
      const y = Math.max(0, o.y + Math.round((ev.clientY - sy) / rowH))
      setItems((prev) => prev.map((i) => (i.fieldId === item.fieldId ? { ...i, x, y } : i)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setItems((prev) => normalize(prev))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (e: React.PointerEvent, item: GridItem) => {
    e.preventDefault()
    e.stopPropagation()
    const cw = colWidth()
    const sx = e.clientX
    const o = { ...item }
    const onMove = (ev: PointerEvent) => {
      const w = clamp(o.w + Math.round((ev.clientX - sx) / cw), 1, GRID_COLS - o.x)
      setItems((prev) => prev.map((i) => (i.fieldId === item.fieldId ? { ...i, w } : i)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const save = () => {
    onSave(items.length ? normalize(items) : undefined)
    onClose()
  }

  return (
    <Modal
      title={`Layout — ${block.title}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn ghost" onClick={() => setItems([])}>
            Clear
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={save}>
            Save layout
          </button>
        </>
      }
    >
      <ol className="lc-howto">
        <li>1. Click a field on the left to place it.</li>
        <li>2. Drag a card to move it; drag two onto the same row to sit side by side.</li>
        <li>3. Drag the orange right edge to make a field wider or narrower.</li>
      </ol>

      <div className="lc-wrap">
        <div className="lc-palette">
          <span className="field-label">Fields</span>
          {unplaced.length === 0 && <p className="lc-empty">All fields are placed.</p>}
          {unplaced.map((f) => (
            <button key={f.id} type="button" className="lc-chip" onClick={() => addToLayout(f.id)}>
              <PlusIcon /> {f.label}
            </button>
          ))}
        </div>

        <div className="lc-canvas">
          <div className="lc-grid" ref={gridRef}>
            {Array.from({ length: GRID_COLS }).map((_, i) => (
              <span key={i} className="lc-col-line" style={{ gridColumn: i + 1 }} />
            ))}
            {items.map((item) => (
              <div
                key={item.fieldId}
                className="lc-item"
                style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: item.y + 1 }}
                onPointerDown={(e) => startMove(e, item)}
              >
                <span className="lc-item-grip"><GripIcon /></span>
                <span className="lc-item-name">{labelOf(item.fieldId)}</span>
                <span className="lc-item-w">{item.w}/12</span>
                <button
                  type="button"
                  className="lc-item-x"
                  title="Remove"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeItem(item.fieldId)}
                >
                  <TrashIcon />
                </button>
                <span className="lc-item-resize" onPointerDown={(e) => startResize(e, item)} />
              </div>
            ))}
            {items.length === 0 && <p className="lc-canvas-empty">Click a field on the left to start.</p>}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function normalize(items: GridItem[]): GridItem[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const rows = Array.from(new Set(sorted.map((i) => i.y)))
  const rowIndex = new Map(rows.map((y, idx) => [y, idx]))
  return sorted.map((i) => ({ ...i, y: rowIndex.get(i.y) ?? 0 }))
}
