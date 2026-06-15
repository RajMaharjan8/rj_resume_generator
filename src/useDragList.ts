import { useState } from 'react'

// Minimal HTML5 drag-and-drop reordering helper.
// Returns props to spread on each draggable row and the index currently
// being dragged over (for visual feedback).
export function useDragList<T>(items: T[], onReorder: (next: T[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = items.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
  }

  const rowProps = (index: number) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      if (overIndex !== index) setOverIndex(index)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (dragIndex !== null) move(dragIndex, index)
      setDragIndex(null)
      setOverIndex(null)
    },
    'data-dragging': dragIndex === index || undefined,
    'data-dragover': overIndex === index && dragIndex !== index ? true : undefined,
  })

  // Spread on the drag handle element only, so inputs stay selectable.
  const handleProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragIndex(index)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: () => {
      setDragIndex(null)
      setOverIndex(null)
    },
  })

  return { rowProps, handleProps }
}
