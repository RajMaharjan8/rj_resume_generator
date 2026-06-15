import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from './auth/AuthContext'
import { useResume } from './useResume'
import { usePortfolio } from './portfolio/usePortfolio'
import { cloneWebBlock, type BlockStyle } from './portfolio/types'
import { cloneBlock, resyncBlock, type Block } from './types'

// Shared app state so it survives navigation between routes (resume ↔ portfolio).
function useWorkspaceState() {
  const { user } = useAuth()
  const resume = useResume(user)
  const portfolio = usePortfolio(user, resume.data)

  const library = resume.data.blockLibrary ?? []

  const createBlock = (block: Block) =>
    resume.setData({ ...resume.data, blockLibrary: [...library, block] })

  const saveEditedBlock = (block: Block) =>
    resume.setData({
      ...resume.data,
      blockLibrary: library.map((b) => (b.id === block.id ? block : b)),
      blocks: resume.data.blocks.map((b) => (b.templateId === block.id ? resyncBlock(b, block) : b)),
    })

  const insertFromLibrary = (templateId: string) => {
    const tpl = library.find((b) => b.id === templateId)
    if (!tpl) return
    resume.setData({ ...resume.data, blocks: [...resume.data.blocks, cloneBlock(tpl)] })
  }

  const removeFromLibrary = (templateId: string) =>
    resume.setData({ ...resume.data, blockLibrary: library.filter((b) => b.id !== templateId) })

  // ---- Portfolio "My web blocks" library ----
  const pfLibrary = portfolio.data.blockLibrary ?? []
  const pfLibStyles = portfolio.data.libraryStyles ?? {}

  // Create: save to library AND insert a copy into the portfolio.
  const pfCreateBlock = (block: Block, style?: BlockStyle) => {
    const copy = cloneWebBlock(block)
    portfolio.setData({
      ...portfolio.data,
      blockLibrary: [...pfLibrary, block],
      libraryStyles: style ? { ...pfLibStyles, [block.id]: style } : pfLibStyles,
      blocks: [...portfolio.data.blocks, copy],
      styles: style ? { ...(portfolio.data.styles ?? {}), [copy.id]: style } : portfolio.data.styles,
    })
  }

  // Edit a template's structure; placed copies are independent (no resync here).
  const pfSaveEditedBlock = (block: Block, style?: BlockStyle) =>
    portfolio.setData({
      ...portfolio.data,
      blockLibrary: pfLibrary.map((b) => (b.id === block.id ? block : b)),
      libraryStyles: style ? { ...pfLibStyles, [block.id]: style } : pfLibStyles,
    })

  const pfInsertFromLibrary = (templateId: string) => {
    const tpl = pfLibrary.find((b) => b.id === templateId)
    if (!tpl) return
    const copy = cloneWebBlock(tpl)
    const style = pfLibStyles[templateId]
    portfolio.setData({
      ...portfolio.data,
      blocks: [...portfolio.data.blocks, copy],
      styles: style ? { ...(portfolio.data.styles ?? {}), [copy.id]: style } : portfolio.data.styles,
    })
  }

  const pfRemoveFromLibrary = (templateId: string) => {
    const { [templateId]: _drop, ...restStyles } = pfLibStyles
    void _drop
    portfolio.setData({
      ...portfolio.data,
      blockLibrary: pfLibrary.filter((b) => b.id !== templateId),
      libraryStyles: restStyles,
    })
  }

  return {
    user,
    resume,
    portfolio,
    library,
    createBlock,
    saveEditedBlock,
    insertFromLibrary,
    removeFromLibrary,
    pfLibrary,
    pfLibStyles,
    pfCreateBlock,
    pfSaveEditedBlock,
    pfInsertFromLibrary,
    pfRemoveFromLibrary,
  }
}

type WorkspaceValue = ReturnType<typeof useWorkspaceState>
const WorkspaceContext = createContext<WorkspaceValue | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceState()
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
