import type { Block } from '../../types'
import Modal from '../atoms/Modal'
import { PlusIcon, TrashIcon } from '../atoms/icons'

interface Props {
  library: Block[]
  onClose: () => void
  onInsert: (templateId: string) => void
  onEdit: (templateId: string) => void
  onDelete: (templateId: string) => void
  onCreateNew: () => void
  title?: string
}

// Lists the user's saved block templates. This is the ONLY place to edit a
// block's structure (fields). The left editor is content-entry only.
export default function BlockManagerModal({
  library,
  onClose,
  onInsert,
  onEdit,
  onDelete,
  onCreateNew,
  title = 'My blocks',
}: Props) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary" onClick={onCreateNew}>
          <PlusIcon /> Create new block
        </button>
      }
    >
      {library.length === 0 ? (
        <p className="mgr-empty">
          You haven’t created any blocks yet. Click <strong>Create new block</strong> to make a
          reusable section.
        </p>
      ) : (
        <div className="mgr-list">
          {library.map((b) => (
            <div key={b.id} className="mgr-item">
              <div className="mgr-info">
                <span className="mgr-name">{b.title}</span>
                <span className="mgr-meta">{summarize(b)}</span>
              </div>
              <div className="mgr-actions">
                <button type="button" className="btn ghost small" onClick={() => onInsert(b.id)}>
                  Insert
                </button>
                <button type="button" className="btn ghost small" onClick={() => onEdit(b.id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  title="Delete block"
                  onClick={() => onDelete(b.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function summarize(b: Block): string {
  const n = b.fields.length
  const types = b.fields.map((f) => f.type)
  const uniq = Array.from(new Set(types))
  return `${n} field${n === 1 ? '' : 's'} · ${uniq.join(', ')}`
}
