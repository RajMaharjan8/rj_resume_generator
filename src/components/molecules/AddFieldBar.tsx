import type { FieldType } from '../../types'
import { PlusIcon } from '../atoms/icons'

const ALL: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'textarea', label: 'Paragraph' },
  { type: 'list', label: 'List' },
  { type: 'tags', label: 'Tags' },
  { type: 'skillbar', label: 'Skill bars' },
  { type: 'date', label: 'Date' },
  { type: 'button', label: 'Button' },
  { type: 'image', label: 'Image' },
  { type: 'repeater', label: 'Repeater' },
]

// Compact, always-visible row of "add field" chips. One click adds a field —
// no extra "Add a field" reveal step.
export default function AddFieldBar({
  onAdd,
  only,
}: {
  onAdd: (type: FieldType) => void
  only?: FieldType[]
}) {
  const items = only ? ALL.filter((i) => only.includes(i.type)) : ALL
  return (
    <div className="add-bar">
      {items.map((i) => (
        <button key={i.type} type="button" className="add-chip" onClick={() => onAdd(i.type)}>
          <PlusIcon /> {i.label}
        </button>
      ))}
    </div>
  )
}
