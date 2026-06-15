import { useState } from 'react'
import { blankValue, type Block, type FieldValue, type ImageMeta } from '../../types'
import FieldInput from '../molecules/FieldInput'
import { ChevronIcon, GripIcon, TrashIcon } from '../atoms/icons'

interface Props {
  block: Block
  onChange: (block: Block) => void
  onRemove?: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

// Content-entry editor for a block. Fields are filled in here; layout (width /
// button opens a visual canvas to arrange them. Collapsible.
export default function BlockEditor({ block, onChange, onRemove, dragHandleProps }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const setValue = (fieldId: string, value: FieldValue) =>
    onChange({ ...block, values: { ...block.values, [fieldId]: value } })

  const setImageMeta = (fieldId: string, meta: ImageMeta) =>
    onChange({ ...block, imageMeta: { ...block.imageMeta, [fieldId]: meta } })

  return (
    <section className={`ed-section block ${collapsed ? 'collapsed' : ''}`}>
      <div className="block-head">
        <span className="drag-handle" title="Drag to reorder section" {...dragHandleProps}>
          <GripIcon />
        </span>

        <button
          type="button"
          className={`collapse-btn ${collapsed ? 'rot' : ''}`}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronIcon />
        </button>

        <h3 className="block-title">{block.title}</h3>

        {block.builtin && <span className="badge">built-in</span>}
        {onRemove && !block.builtin && (
          <button type="button" className="icon-btn danger" title="Remove from resume" onClick={onRemove}>
            <TrashIcon />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="block-fields">
          {block.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={block.values[field.id] ?? blankValue(field)}
              onChange={(v) => setValue(field.id, v)}
              imageMeta={block.imageMeta?.[field.id]}
              onImageMeta={(meta) => setImageMeta(field.id, meta)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
