import { useMemo, useState } from 'react'
import {
  blockFromFields,
  f as makeField,
  type Block,
  type FieldDef,
  type FieldType,
  type GridItem,
} from '../../types'
import Modal from '../atoms/Modal'
import AddFieldBar from '../molecules/AddFieldBar'
import LayoutCanvasModal from './LayoutCanvasModal'
import { GripIcon, LayoutIcon, TrashIcon } from '../atoms/icons'
import { useDragList } from '../../useDragList'

interface Props {
  onClose: () => void
  onSave: (block: Block) => void
  initial?: Block
  existing?: Block[]
}

const TYPE_LABEL: Record<FieldType, string> = {
  text: 'Short text',
  textarea: 'Paragraph',
  list: 'List',
  tags: 'Tags',
  skillbar: 'Skill bars',
  date: 'Date',
  button: 'Button',
  image: 'Image',
  repeater: 'Repeater',
}

function makeOf(type: FieldType, label: string): FieldDef {
  if (type === 'repeater') return makeField.repeater(label, [makeField.text('Field')])
  return makeField[type](label)
}

export default function CreateBlockModal({ onClose, onSave, initial, existing = [] }: Props) {
  const editing = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [fields, setFields] = useState<FieldDef[]>(
    initial ? initial.fields.map((f) => ({ ...f })) : [makeField.text('Field')],
  )
  const [grid, setGrid] = useState<GridItem[] | undefined>(initial?.grid)
  const [layoutOpen, setLayoutOpen] = useState(false)

  const drag = useDragList(fields, setFields)

  const addField = (type: FieldType) =>
    setFields((prev) => [...prev, makeOf(type, type === 'text' ? 'Field' : TYPE_LABEL[type])])
  const rename = (id: string, label: string) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)))
  const remove = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id))
  const patch = (id: string, p: Partial<FieldDef>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)))

  const trimmed = title.trim()
  const duplicate = existing.some(
    (b) => b.id !== initial?.id && b.title.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  const canSave = trimmed.length > 0 && fields.length > 0 && !duplicate

  // Keep only layout placements for fields that still exist.
  const ids = new Set(fields.map((f) => f.id))
  const cleanGrid = grid?.filter((g) => ids.has(g.fieldId))

  const save = () => {
    if (!canSave) return
    const base = blockFromFields(title, fields)
    onSave(editing && initial ? { ...base, id: initial.id, grid: cleanGrid } : { ...base, grid: cleanGrid })
    onClose()
  }

  // Live draft for the layout canvas (current fields/title). Memoized so its id
  // stays stable across renders (blockFromFields mints a fresh id each call).
  const draftBlock: Block = useMemo(
    () => ({ ...blockFromFields(title || 'Section', fields), grid: cleanGrid }),
    [title, fields, cleanGrid],
  )

  return (
    <Modal
      title={editing ? 'Edit block' : 'Create a block'}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn ghost mr-auto"
            disabled={fields.length === 0}
            onClick={() => setLayoutOpen(true)}
            title="Arrange fields on a grid"
          >
            <LayoutIcon /> Layout
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" disabled={!canSave} onClick={save}>
            {editing ? 'Save changes' : 'Create block'}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field-label">Section title (required)</span>
        <input
          className="input"
          autoFocus
          placeholder="e.g. Languages, Certifications, Awards"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {trimmed.length === 0 && (
          <span className="fl-hint cb-required">Give your section a title to continue.</span>
        )}
        {trimmed.length > 0 && duplicate && (
          <span className="fl-hint cb-required">A block named “{trimmed}” already exists.</span>
        )}
      </label>

      <div className="cb-fields-head">
        <span className="field-label">Fields</span>
        <span className="fl-hint">drag to reorder · click a name to rename</span>
      </div>

      <div className="cb-fields">
        {fields.map((field, i) => (
          <div key={field.id} className="cb-field-block">
            <div className="cb-field-row" {...drag.rowProps(i)}>
              <span className="drag-handle small" title="Drag to reorder" {...drag.handleProps(i)}>
                <GripIcon />
              </span>
              <input
                className="cb-name"
                value={field.label}
                onChange={(e) => rename(field.id, e.target.value)}
                placeholder="Field name"
              />
              <span className="cb-type">{TYPE_LABEL[field.type]}</span>
              <button
                type="button"
                className="icon-btn danger tiny"
                title="Remove field"
                onClick={() => remove(field.id)}
              >
                <TrashIcon />
              </button>
            </div>

            <AlignRow field={field} onPatch={(p) => patch(field.id, p)} />

            {field.type === 'repeater' && (
              <SubFieldEditor
                fields={field.fields ?? []}
                onChange={(sub) => patch(field.id, { fields: sub })}
              />
            )}
          </div>
        ))}
        {fields.length === 0 && <p className="cb-empty">Add at least one field below.</p>}
      </div>

      {/* Repeater intentionally excluded from resume blocks for now. */}
      <AddFieldBar onAdd={addField} only={['text', 'textarea', 'list', 'tags', 'date', 'image']} />

      {layoutOpen && (
        <LayoutCanvasModal block={draftBlock} onClose={() => setLayoutOpen(false)} onSave={setGrid} />
      )}
    </Modal>
  )
}

// Edits the inner fields of a repeater.
function SubFieldEditor({
  fields,
  onChange,
}: {
  fields: FieldDef[]
  onChange: (fields: FieldDef[]) => void
}) {
  const drag = useDragList(fields, onChange)

  const add = (type: FieldType) => onChange([...fields, makeOf(type, TYPE_LABEL[type])])
  const rename = (id: string, label: string) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, label } : f)))
  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id))
  const patch = (id: string, p: Partial<FieldDef>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...p } : f)))

  return (
    <div className="cb-sub">
      <span className="cb-sub-title">Each entry contains:</span>
      <div className="cb-sub-list">
        {fields.map((sf, i) => (
          <div key={sf.id} className="cb-sub-block">
            <div className="cb-sub-row" {...drag.rowProps(i)}>
              <span className="drag-handle small" title="Drag to reorder" {...drag.handleProps(i)}>
                <GripIcon />
              </span>
              <input
                className="cb-name"
                value={sf.label}
                onChange={(e) => rename(sf.id, e.target.value)}
                placeholder="Field name"
              />
              <span className="cb-type">{TYPE_LABEL[sf.type]}</span>
              <button
                type="button"
                className="icon-btn danger tiny"
                title="Remove"
                onClick={() => remove(sf.id)}
              >
                <TrashIcon />
              </button>
            </div>
            <AlignRow field={sf} onPatch={(p) => patch(sf.id, p)} />
          </div>
        ))}
        {fields.length === 0 && <p className="cb-empty">Add at least one field to the entry.</p>}
      </div>
      <div className="cb-sub-add">
        <AddFieldBar onAdd={add} only={['text', 'textarea', 'image']} />
      </div>
    </div>
  )
}

// A small "Align right" toggle per field — sends it to the right of its row
// (e.g. a date next to a job title).
function AlignRow({ field, onPatch }: { field: FieldDef; onPatch: (p: Partial<FieldDef>) => void }) {
  return (
    <label className="cb-align">
      <input
        type="checkbox"
        checked={field.alignRight ?? false}
        onChange={(e) => onPatch({ alignRight: e.target.checked })}
      />
      Align right (e.g. a date)
    </label>
  )
}
