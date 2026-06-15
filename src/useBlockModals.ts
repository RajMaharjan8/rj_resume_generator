import { useState } from 'react'

export type ModalKind =
  | null
  | 'manager'
  | 'create-block'
  | 'sign-in'
  | 'pf-manager'
  | 'pf-create'

// Tracks which block-related modal is open in the layout.
export function useBlockModals() {
  const [modal, setModal] = useState<ModalKind>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  return { modal, setModal, editingId, setEditingId }
}
