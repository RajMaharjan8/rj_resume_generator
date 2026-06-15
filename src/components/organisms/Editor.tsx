import { useState } from 'react'
import { CONTACT_TYPES, newId, type Block, type ResumeData } from '../../types'
import { useDragList } from '../../useDragList'
import { useAuth } from '../../auth/AuthContext'
import { compressImage, validateImage, ACCEPT_ATTR, MAX_IMAGE_LABEL } from '../../lib/photo'
import BlockEditor from './BlockEditor'
import { GripIcon, ImageIcon, PlusIcon, TrashIcon } from '../atoms/icons'

interface Props {
  data: ResumeData
  onChange: (data: ResumeData) => void
  onInsertFromLibrary?: (templateId: string) => void
  // Blocks offered in the "Add section" picker: built-in defaults + saved blocks.
  insertableBlocks?: Block[]
}

export default function Editor({ data, onChange, onInsertFromLibrary, insertableBlocks }: Props) {
  const blockDrag = useDragList(data.blocks, (blocks) => onChange({ ...data, blocks }))

  const updateBlock = (b: Block) =>
    onChange({ ...data, blocks: data.blocks.map((x) => (x.id === b.id ? b : x)) })
  const removeBlock = (id: string) =>
    onChange({ ...data, blocks: data.blocks.filter((x) => x.id !== id) })

  return (
    <div className="editor">
      <HeaderEditor data={data} onChange={onChange} />

      {data.blocks.map((block, i) => (
        <div key={block.id} className="block-drag-wrap" {...blockDrag.rowProps(i)}>
          <BlockEditor
            block={block}
            onChange={updateBlock}
            onRemove={() => removeBlock(block.id)}
            dragHandleProps={blockDrag.handleProps(i)}
          />
        </div>
      ))}

      <AddSection
        library={insertableBlocks ?? data.blockLibrary ?? []}
        onInsert={(id) => onInsertFromLibrary?.(id)}
      />
    </div>
  )
}

function HeaderEditor({ data, onChange }: Props) {
  const h = data.header
  const setHeader = (patch: Partial<ResumeData['header']>) =>
    onChange({ ...data, header: { ...h, ...patch } })

  const contactDrag = useDragList(h.contacts, (contacts) => setHeader({ contacts }))

  const updateContact = (id: string, patch: Partial<(typeof h.contacts)[number]>) =>
    setHeader({ contacts: h.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const addContact = () =>
    setHeader({ contacts: [...h.contacts, { id: newId(), type: 'website', value: '' }] })
  const removeContact = (id: string) =>
    setHeader({ contacts: h.contacts.filter((c) => c.id !== id) })

  return (
    <section className="ed-section">
      <div className="ed-section-head">
        <h3>Header</h3>
      </div>

      <PhotoUpload
        photo={h.photo}
        size={h.photoSize ?? 64}
        shape={h.photoShape ?? 'circle'}
        onChange={(photo) => setHeader({ photo })}
        onSize={(photoSize) => setHeader({ photoSize })}
        onShape={(photoShape) => setHeader({ photoShape })}
      />

      <div className="grid2">
        <label className="field">
          <span className="field-label">Full name</span>
          <input className="input" value={h.fullName} onChange={(e) => setHeader({ fullName: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Job title</span>
          <input className="input" value={h.title} onChange={(e) => setHeader({ title: e.target.value })} />
        </label>
      </div>

      <div className="contacts-head">
        <span className="field-label">Contact details</span>
        <button type="button" className="link-btn" onClick={addContact}>
          <PlusIcon /> Add contact
        </button>
      </div>

      {h.contacts.map((c, i) => (
        <div key={c.id} className="contact-row" {...contactDrag.rowProps(i)}>
          <span className="drag-handle small" title="Drag to reorder" {...contactDrag.handleProps(i)}>
            <GripIcon />
          </span>
          <select
            className="select"
            value={c.type}
            onChange={(e) => updateContact(c.id, { type: e.target.value })}
          >
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="input"
            value={c.value}
            placeholder="value"
            onChange={(e) => updateContact(c.id, { value: e.target.value })}
          />
          <button
            type="button"
            className="icon-btn danger"
            title="Remove"
            onClick={() => removeContact(c.id)}
          >
            <TrashIcon />
          </button>
        </div>
      ))}
    </section>
  )
}

// Bottom "Add section" control. Opens a dropdown of the user's saved block
// templates; clicking one inserts a fresh copy. Empty → prompt to create one.
// Managing/editing/deleting templates lives in the "My blocks" manager.
function AddSection({
  library,
  onInsert,
}: {
  library: Block[]
  onInsert: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="add-section">
      <button
        type="button"
        className="add-section-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <PlusIcon /> Add section
      </button>

      {open && (
        <div className="add-section-menu">
          {library.length === 0 ? (
            <p className="add-section-empty">
              Please create a block first — open <strong>My blocks</strong> at the top.
            </p>
          ) : (
            <>
              <span className="add-section-label">Insert a saved block</span>
              {library.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="add-section-pick"
                  onClick={() => {
                    onInsert(b.id)
                    setOpen(false)
                  }}
                >
                  <PlusIcon /> {b.title}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Profile photo: compressed + stored inline, only when signed in. Includes
// size (slider) and shape (circle/square) controls.
function PhotoUpload({
  photo,
  size,
  shape,
  onChange,
  onSize,
  onShape,
}: {
  photo: string
  size: number
  shape: 'circle' | 'square'
  onChange: (url: string) => void
  onSize: (px: number) => void
  onShape: (shape: 'circle' | 'square') => void
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file || !user) return
    const err = validateImage(file)
    if (err) {
      alert(err)
      return
    }
    setBusy(true)
    try {
      // Compressed inline (base64) — no Firebase Storage needed.
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } catch (e) {
      console.error(e)
      alert('Could not process that image. Please try a different file.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = () => onChange('')

  return (
    <div className="field photo-field">
      <span className="field-label">Profile photo</span>
      <div className="photo-row">
        <div className={`photo-thumb ${shape === 'square' ? 'square' : ''}`}>
          {photo ? <img src={photo} alt="" /> : <ImageIcon className="photo-placeholder" />}
        </div>

        {user ? (
          <div className="photo-controls">
            <div className="photo-controls-top">
              <label className={`btn ghost small file-btn ${busy ? 'disabled' : ''}`}>
                {busy ? 'Processing…' : photo ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  accept={ACCEPT_ATTR}
                  hidden
                  disabled={busy}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              {photo && (
                <button type="button" className="link-btn" disabled={busy} onClick={handleRemove}>
                  Remove
                </button>
              )}
            </div>

            {photo && (
              <>
                <label className="fl-ctrl">
                  <span className="fl-layout-label">Size</span>
                  <input
                    type="range"
                    min={48}
                    max={160}
                    step={4}
                    value={size}
                    onChange={(e) => onSize(Number(e.target.value))}
                  />
                  <span className="fl-val">{size}px</span>
                </label>
                <div className="seg sm">
                  <button
                    type="button"
                    className={`seg-btn ${shape === 'circle' ? 'active' : ''}`}
                    onClick={() => onShape('circle')}
                  >
                    Circle
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${shape === 'square' ? 'active' : ''}`}
                    onClick={() => onShape('square')}
                  >
                    Square
                  </button>
                </div>
              </>
            )}
            <span className="fl-hint">PNG, JPG or JPEG · max {MAX_IMAGE_LABEL}</span>
          </div>
        ) : (
          <p className="fl-hint">Sign in to upload a profile photo.</p>
        )}
      </div>
    </div>
  )
}
