import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../useTheme'
import { useWorkspace } from '../WorkspaceContext'
import { useBlockModals } from '../useBlockModals'
import { downloadPortfolioZip } from '../portfolio/exportSite'
import CreateBlockModal from '../components/organisms/CreateBlockModal'
import BlockManagerModal from '../components/organisms/BlockManagerModal'
import PortfolioCreateBlockModal from '../portfolio/PortfolioCreateBlockModal'
import SignInPrompt from '../components/organisms/SignInPrompt'
import {
  FileIcon,
  DownloadIcon,
  MoonIcon,
  SunIcon,
  GoogleIcon,
  BlocksIcon,
  MenuIcon,
} from '../components/atoms/icons'

export default function Layout() {
  const ws = useWorkspace()
  const {
    resume, portfolio, library, createBlock, saveEditedBlock, insertFromLibrary, removeFromLibrary,
    pfLibrary, pfLibStyles, pfCreateBlock, pfSaveEditedBlock, pfRemoveFromLibrary, pfInsertFromLibrary,
  } = ws
  const { modal, setModal, editingId, setEditingId } = useBlockModals()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isPortfolio = location.pathname.startsWith('/portfolio')

  // "My blocks" / "My web blocks" depending on the route.
  const openBlocks = () => setModal(user ? (isPortfolio ? 'pf-manager' : 'manager') : 'sign-in')
  const download = () => {
    if (isPortfolio) downloadPortfolioZip(portfolio.data)
    else window.print()
  }

  const editingBlock = editingId ? library.find((b) => b.id === editingId) : undefined
  const pfEditingBlock = editingId ? pfLibrary.find((b) => b.id === editingId) : undefined

  return (
    <div className="app">
      <TopBar
        saveState={isPortfolio ? portfolio.saveState : resume.saveState}
        saveError={isPortfolio ? portfolio.saveError ?? null : resume.saveError ?? null}
        isPortfolio={isPortfolio}
        onSetView={(v) => navigate(v === 'portfolio' ? '/portfolio' : '/')}
        downloadLabel={isPortfolio ? 'Download site' : 'Download PDF'}
        onDownload={download}
        onReset={() => {
          if (isPortfolio) {
            if (confirm('Reset the portfolio to the Designer template? Your sections will be replaced (your saved web blocks are kept).')) {
              portfolio.resetFromResume()
            }
          } else {
            resume.reset()
          }
        }}
        onOpenBlocks={openBlocks}
      />

      <Outlet />

      {modal === 'manager' && (
        <BlockManagerModal
          library={library}
          onClose={() => setModal(null)}
          onInsert={(id) => {
            insertFromLibrary(id)
            setModal(null)
          }}
          onEdit={(id) => {
            setEditingId(id)
            setModal('create-block')
          }}
          onDelete={removeFromLibrary}
          onCreateNew={() => {
            setEditingId(null)
            setModal('create-block')
          }}
        />
      )}
      {modal === 'create-block' && (
        <CreateBlockModal
          initial={editingBlock}
          existing={library}
          onClose={() => {
            setEditingId(null)
            setModal('manager')
          }}
          onSave={(block) => {
            if (editingBlock) saveEditedBlock(block)
            else createBlock(block)
          }}
        />
      )}
      {modal === 'pf-manager' && (
        <BlockManagerModal
          title="My web blocks"
          library={pfLibrary}
          onClose={() => setModal(null)}
          onInsert={(id) => {
            pfInsertFromLibrary(id)
            setModal(null)
          }}
          onEdit={(id) => {
            setEditingId(id)
            setModal('pf-create')
          }}
          onDelete={pfRemoveFromLibrary}
          onCreateNew={() => {
            setEditingId(null)
            setModal('pf-create')
          }}
        />
      )}
      {modal === 'pf-create' && (
        <PortfolioCreateBlockModal
          initial={pfEditingBlock}
          initialStyle={editingId ? pfLibStyles[editingId] : undefined}
          existing={pfLibrary}
          onClose={() => {
            setEditingId(null)
            setModal('pf-manager')
          }}
          onSave={(block, style) => {
            if (pfEditingBlock) pfSaveEditedBlock(block, style)
            else pfCreateBlock(block, style)
          }}
        />
      )}
      {modal === 'sign-in' && (
        <SignInPrompt onClose={() => setModal(null)} onSignedIn={() => setModal(null)} />
      )}
    </div>
  )
}

function TopBar({
  saveState,
  saveError,
  isPortfolio,
  onSetView,
  downloadLabel,
  onDownload,
  onReset,
  onOpenBlocks,
}: {
  saveState: string
  saveError?: string | null
  isPortfolio: boolean
  onSetView: (v: 'resume' | 'portfolio') => void
  downloadLabel: string
  onDownload: () => void
  onReset: () => void
  onOpenBlocks: () => void
}) {
  const { user, loading, enabled, signInWithGoogle, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const themeLabel = theme === 'dark' ? 'Light mode' : 'Dark mode'

  return (
    <header className="topbar">
      <div className="brand">
        <FileIcon className="logo" />
        <span className="brand-name">RJResume</span>
        <div className="seg view-switch">
          <button
            type="button"
            className={`seg-btn ${!isPortfolio ? 'active' : ''}`}
            onClick={() => onSetView('resume')}
          >
            Resume
          </button>
          <button
            type="button"
            className={`seg-btn ${isPortfolio ? 'active' : ''}`}
            onClick={() => onSetView('portfolio')}
          >
            Portfolio
          </button>
        </div>
        {user && (
          <button
            type="button"
            className="save-state"
            data-state={saveState}
            title={saveError ?? undefined}
            onClick={() => { if (saveError) alert(saveError) }}
            disabled={!saveError}
          >
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && 'Saved'}
            {saveState === 'error' && 'Save failed — click for details'}
            {saveState === 'too-big' && 'Too big to sync'}
          </button>
        )}
      </div>

      <div className="topbar-actions">
        <button className="btn primary" onClick={onDownload}>
          <DownloadIcon /> <span className="hide-xs">{downloadLabel}</span>
        </button>

        <div className="topbar-inline">
          <button className="btn ghost" onClick={onOpenBlocks}>
            <BlocksIcon /> {isPortfolio ? 'My web blocks' : 'My blocks'}
          </button>
          <button className="btn ghost icon-only" onClick={toggle} title={themeLabel} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="btn ghost" onClick={onReset} title={isPortfolio ? 'Reset to Designer template' : 'Reset to sample'}>
            Reset
          </button>
          {loading ? (
            <span className="muted">…</span>
          ) : user ? (
            <div className="user">
              {user.photoURL && <img src={user.photoURL} alt="" className="avatar" />}
              <span className="user-name">{user.displayName ?? user.email}</span>
              <button className="btn ghost small" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="btn google" onClick={signInWithGoogle}>
              <GoogleIcon /> {enabled ? 'Sign in' : 'Sign in (setup)'}
            </button>
          )}
        </div>

        <div className="topbar-overflow">
          <button
            className="btn ghost icon-only"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="menu-pop">
                <button className="menu-row" onClick={() => { onOpenBlocks(); setMenuOpen(false) }}>
                  <BlocksIcon /> {isPortfolio ? 'My web blocks' : 'My blocks'}
                </button>
                <button className="menu-row" onClick={() => { toggle(); setMenuOpen(false) }}>
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />} {themeLabel}
                </button>
                <button className="menu-row" onClick={() => { onReset(); setMenuOpen(false) }}>
                  {isPortfolio ? 'Reset portfolio' : 'Reset to sample'}
                </button>
                <div className="menu-sep" />
                {user ? (
                  <button className="menu-row" onClick={() => { signOut(); setMenuOpen(false) }}>
                    {user.photoURL && <img src={user.photoURL} alt="" className="avatar" />}
                    Sign out
                  </button>
                ) : (
                  <button className="menu-row" onClick={() => { signInWithGoogle(); setMenuOpen(false) }}>
                    <GoogleIcon /> {enabled ? 'Sign in with Google' : 'Sign in (setup)'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
