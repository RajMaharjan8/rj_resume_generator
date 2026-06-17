import { useState } from 'react'
import {
  blankRow,
  type FieldDef,
  type FieldValue,
  type ImageMeta,
  type RepeaterRow,
} from '../../types'
import { useDragList } from '../../useDragList'
import { ChevronIcon, GripIcon, ImageIcon, PlusIcon, TrashIcon } from '../atoms/icons'
import { compressImage, validateImage, ACCEPT_ATTR, MAX_IMAGE_LABEL } from '../../lib/photo'
import RichText from './RichText'
import { suggestPhrasings, tipFor } from '../../lib/phrasing'

interface Props {
  field: FieldDef
  value: FieldValue
  onChange: (value: FieldValue) => void
  // When provided, the field label is click-to-rename and a hover delete shows.
  onRename?: (label: string) => void
  onDelete?: () => void
  // For repeater fields: rename one of the row sub-field labels by id.
  onRenameSub?: (subFieldId: string, label: string) => void
  // For image fields: current display meta + setter (size/shape).
  imageMeta?: ImageMeta
  onImageMeta?: (meta: ImageMeta) => void
  // Hide the circle/rounded/square shape control (portfolio doesn't use it).
  hideImageShape?: boolean
}

// A label that turns into an input on click (WordPress/Notion style), with an
// optional hover delete button. Used for user-added fields.
function FieldLabel({
  label,
  hint,
  onRename,
  onDelete,
}: {
  label: string
  hint?: string
  onRename?: (label: string) => void
  onDelete?: () => void
}) {
  return (
    <div className="fl-row">
      {onRename ? (
        <input
          className="fl-label-edit"
          value={label}
          title="Click to rename this field"
          onChange={(e) => onRename(e.target.value)}
        />
      ) : (
        <span className="field-label">{label}</span>
      )}
      {hint && <span className="fl-hint">{hint}</span>}
      {onDelete && (
        <button type="button" className="fl-delete" title="Delete field" onClick={onDelete}>
          <TrashIcon />
        </button>
      )}
    </div>
  )
}

export default function FieldInput({
  field,
  value,
  onChange,
  onRename,
  onDelete,
  onRenameSub,
  imageMeta,
  onImageMeta,
  hideImageShape,
}: Props) {
  const labelEl = (hint?: string) => (
    <FieldLabel label={field.label} hint={hint} onRename={onRename} onDelete={onDelete} />
  )

  switch (field.type) {
    case 'text':
      return (
        <div className="field">
          {labelEl()}
          <input
            className="input"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case 'date':
      return (
        <div className="field">
          {labelEl('shows on the right')}
          <input
            className="input"
            placeholder="e.g. 2014 – 2018 or Jan 2021 – Present"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case 'button': {
      // Stored as "label|url".
      const [blabel = '', burl = ''] = ((value as string) ?? '').split('|')
      const setBtn = (l: string, u: string) => onChange(`${l}|${u}`)
      return (
        <div className="field">
          {labelEl('button')}
          <div className="grid2 tight">
            <input
              className="input"
              placeholder="Button text (e.g. Hire me)"
              value={blabel}
              onChange={(e) => setBtn(e.target.value, burl)}
            />
            <input
              className="input"
              placeholder="Link (URL or email)"
              value={burl}
              onChange={(e) => setBtn(blabel, e.target.value)}
            />
          </div>
        </div>
      )
    }

    case 'textarea':
      return (
        <div className="field">
          {labelEl()}
          <RichText value={(value as string) ?? ''} onChange={(html) => onChange(html)} />
          <PhrasingHelper
            onInsert={(line) => {
              const prev = ((value as string) ?? '').trim()
              onChange(`${prev}<p>${line}</p>`)
            }}
          />
        </div>
      )

    case 'list': {
      const items = (value as string[]) ?? []
      return (
        <div className="field">
          {labelEl('one item per line')}
          <textarea
            className="input textarea"
            rows={3}
            value={items.join('\n')}
            onChange={(e) =>
              onChange(e.target.value.split('\n').map((s) => s.replace(/^\s+/, '')))
            }
          />
        </div>
      )
    }

    case 'skillbar': {
      // Each line: "Skill name 90" — last number is the percentage.
      const items = (value as string[]) ?? []
      return (
        <div className="field">
          {labelEl('one skill per line, e.g. "Photoshop 90"')}
          <textarea
            className="input textarea"
            rows={4}
            value={items.join('\n')}
            onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.replace(/^\s+/, '')))}
          />
        </div>
      )
    }

    case 'tags': {
      const tags = (value as string[]) ?? []
      return (
        <div className="field">
          {labelEl('comma separated')}
          <textarea
            className="input textarea"
            rows={2}
            value={tags.join(', ')}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      )
    }

    case 'image':
      return (
        <div className="field">
          {labelEl()}
          <ImageBody
            value={(value as string) ?? ''}
            onChange={onChange}
            meta={imageMeta}
            onMeta={onImageMeta}
            hideShape={hideImageShape}
          />
        </div>
      )

    case 'repeater':
      return (
        <div className="field">
          {labelEl()}
          <RepeaterBody
            field={field}
            rows={(value as RepeaterRow[]) ?? []}
            onChange={onChange}
            onRenameSub={onRenameSub}
          />
        </div>
      )

    default:
      return null
  }
}

// A small, dismissible helper under rich-text fields that offers human-sounding
// phrasing scaffolds. It nudges users away from buzzword-formulaic bullets; the
// suggestions are starting points to edit, not finished copy. No AI call — it's
// a local rotation of varied openers (see lib/phrasing).
function PhrasingHelper({ onInsert }: { onInsert: (line: string) => void }) {
  const [open, setOpen] = useState(false)
  const [seed, setSeed] = useState(0)
  const suggestions = suggestPhrasings(seed)

  if (!open) {
    return (
      <button type="button" className="link-btn phrasing-toggle" onClick={() => setOpen(true)}>
        Need a human-sounding line?
      </button>
    )
  }

  return (
    <div className="phrasing">
      <div className="phrasing-head">
        <span className="phrasing-tip">{tipFor(seed)}</span>
        <div className="phrasing-actions">
          <button type="button" className="link-btn" onClick={() => setSeed((s) => s + 1)}>
            Shuffle
          </button>
          <button type="button" className="link-btn" onClick={() => setOpen(false)}>
            Hide
          </button>
        </div>
      </div>
      <div className="phrasing-list">
        {suggestions.map((s, i) => (
          <button
            key={i}
            type="button"
            className="phrasing-chip"
            title="Insert this as a starting line to edit"
            onClick={() => onInsert(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function ImageBody({
  value,
  onChange,
  meta,
  onMeta,
  hideShape,
}: {
  value: string
  onChange: (v: string) => void
  meta?: ImageMeta
  onMeta?: (meta: ImageMeta) => void
  hideShape?: boolean
}) {
  const onFile = async (file: File | undefined) => {
    if (!file) return
    const err = validateImage(file)
    if (err) {
      alert(err)
      return
    }
    try {
      // Compress + inline so it stays small enough for Firestore.
      onChange(await compressImage(file, 900, 500_000))
    } catch {
      alert('Could not process that image. Please try a different file.')
    }
  }

  const size = meta?.size ?? 120
  const shape = meta?.shape ?? 'rounded'

  return (
    <div className="image-field">
      <div className="image-preview">
        {value ? <img src={value} alt="" /> : <ImageIcon className="image-placeholder" />}
      </div>
      <div className="image-controls">
        <div className="photo-controls-top">
          <label className="btn ghost small file-btn">
            Upload
            <input type="file" accept={ACCEPT_ATTR} hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {value && (
            <button type="button" className="link-btn" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        <input
          className="input"
          placeholder="or paste image URL"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
        />

        {value && onMeta && (
          <>
            <label className="fl-ctrl">
              <span className="fl-layout-label">Size</span>
              <input
                type="range"
                min={48}
                max={320}
                step={8}
                value={size}
                onChange={(e) => onMeta({ ...meta, size: Number(e.target.value) })}
              />
              <span className="fl-val">{size}px</span>
            </label>
            {!hideShape && (
              <div className="seg sm">
                {(['square', 'rounded', 'circle'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`seg-btn ${shape === s ? 'active' : ''}`}
                    onClick={() => onMeta({ ...meta, shape: s })}
                  >
                    {s === 'square' ? 'Square' : s === 'rounded' ? 'Rounded' : 'Circle'}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <span className="fl-hint">PNG, JPG or JPEG · max {MAX_IMAGE_LABEL}</span>
      </div>
    </div>
  )
}

function RepeaterBody({
  field,
  rows,
  onChange,
  onRenameSub,
}: {
  field: FieldDef
  rows: RepeaterRow[]
  onChange: (rows: RepeaterRow[]) => void
  onRenameSub?: (subFieldId: string, label: string) => void
}) {
  const sub = field.fields ?? []
  const drag = useDragList(rows, onChange)
  // Collapsed entries, tracked by row id so it survives reordering.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const addRow = () => onChange([...rows, blankRow(sub)])
  const removeRow = (i: number) => onChange(rows.filter((_, j) => j !== i))
  const updateRow = (i: number, fieldId: string, v: string | string[]) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [fieldId]: v } : r)))

  return (
    <div className="repeater">
      {rows.map((row, i) => {
        const rowId = (row.__id as string) ?? String(i)
        const isCollapsed = collapsed.has(rowId)
        // Summary shown when collapsed: the first non-empty text sub-field.
        const summary =
          sub.map((sf) => row[sf.id]).find((v) => typeof v === 'string' && v.trim()) || 'Empty entry'
        return (
          <div key={rowId} className={`rep-row ${isCollapsed ? 'collapsed' : ''}`} {...drag.rowProps(i)}>
            <div className="rep-row-bar">
              <span className="drag-handle small" title="Drag to reorder" {...drag.handleProps(i)}>
                <GripIcon />
              </span>
              <button
                type="button"
                className={`collapse-btn small ${isCollapsed ? 'rot' : ''}`}
                onClick={() => toggle(rowId)}
                aria-label={isCollapsed ? 'Expand entry' : 'Collapse entry'}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <ChevronIcon />
              </button>
              {isCollapsed && <span className="rep-row-summary">{summary as string}</span>}
              <button
                type="button"
                className="icon-btn danger rep-row-del"
                title="Remove entry"
                onClick={() => removeRow(i)}
              >
                <TrashIcon />
              </button>
            </div>
            {!isCollapsed &&
              sub.map((sf) => (
                <FieldInput
                  key={sf.id}
                  field={sf}
                  value={row[sf.id] ?? (sf.type === 'tags' ? [] : '')}
                  onChange={(v) => updateRow(i, sf.id, v as string | string[])}
                  // Sub-field labels are the shared row schema, so only let the
                  // first row's labels be renamed (avoids one editable copy per row).
                  onRename={
                    i === 0 && onRenameSub ? (label) => onRenameSub(sf.id, label) : undefined
                  }
                />
              ))}
          </div>
        )
      })}
      <button type="button" className="add-entry-btn" onClick={addRow}>
        <PlusIcon /> Add entry
      </button>
    </div>
  )
}
