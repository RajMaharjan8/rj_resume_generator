import { useState } from 'react'
import { blankValue, type Block, type FieldValue, type ImageMeta } from '../types'
import FieldInput from '../components/molecules/FieldInput'
import { ChevronIcon, GripIcon, TrashIcon } from '../components/atoms/icons'
import type { BlockAlign, BlockBg, BlockPad, BlockStyle } from './types'

interface Props {
  block: Block
  style?: BlockStyle
  onChange: (block: Block) => void
  onStyleChange: (style: BlockStyle) => void
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

const BGS: { v: BlockBg; label: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'soft', label: 'Soft' },
  { v: 'accent', label: 'Accent' },
  { v: 'dark', label: 'Dark' },
]
const PADS: { v: BlockPad; label: string }[] = [
  { v: 'compact', label: 'Compact' },
  { v: 'normal', label: 'Normal' },
  { v: 'roomy', label: 'Roomy' },
]
const ALIGNS: { v: BlockAlign; label: string }[] = [
  { v: 'left', label: 'Left' },
  { v: 'center', label: 'Center' },
]

// Portfolio section editor — CONTENT + ARRANGE only. Fields/structure are edited
// in "My web blocks". Here the user fills values, sets the section's style, and
// can reorder / remove the section.
export default function PortfolioBlockEditor({
  block,
  style,
  onChange,
  onStyleChange,
  onRemove,
  dragHandleProps,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const st = style ?? {}

  const setValue = (fieldId: string, value: FieldValue) =>
    onChange({ ...block, values: { ...block.values, [fieldId]: value } })
  const setImageMeta = (fieldId: string, meta: ImageMeta) =>
    onChange({ ...block, imageMeta: { ...block.imageMeta, [fieldId]: meta } })

  return (
    <section className={`ed-section block ${collapsed ? 'collapsed' : ''}`}>
      <div className="block-head">
        <span className="drag-handle" title="Drag to reorder" {...dragHandleProps}>
          <GripIcon />
        </span>
        <button
          type="button"
          className={`collapse-btn ${collapsed ? 'rot' : ''}`}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronIcon />
        </button>
        <h3 className="block-title">{block.title}</h3>
        <button type="button" className="icon-btn danger" title="Remove section" onClick={onRemove}>
          <TrashIcon />
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="pf-style-row">
            <label className="pf-style-ctrl">
              <span className="fl-layout-label">Background</span>
              <select className="select" value={st.bg ?? 'none'} onChange={(e) => onStyleChange({ ...st, bg: e.target.value as BlockBg })}>
                {BGS.map((o) => (<option key={o.v} value={o.v}>{o.label}</option>))}
              </select>
            </label>
            <label className="pf-style-ctrl">
              <span className="fl-layout-label">Spacing</span>
              <select className="select" value={st.pad ?? 'normal'} onChange={(e) => onStyleChange({ ...st, pad: e.target.value as BlockPad })}>
                {PADS.map((o) => (<option key={o.v} value={o.v}>{o.label}</option>))}
              </select>
            </label>
            <label className="pf-style-ctrl">
              <span className="fl-layout-label">Align</span>
              <select className="select" value={st.align ?? 'left'} onChange={(e) => onStyleChange({ ...st, align: e.target.value as BlockAlign })}>
                {ALIGNS.map((o) => (<option key={o.v} value={o.v}>{o.label}</option>))}
              </select>
            </label>
          </div>
          <div className="block-fields">
            {block.fields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={block.values[field.id] ?? blankValue(field)}
                onChange={(v) => setValue(field.id, v)}
                imageMeta={block.imageMeta?.[field.id]}
                onImageMeta={(meta) => setImageMeta(field.id, meta)}
                hideImageShape
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
