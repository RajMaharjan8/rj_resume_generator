import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../lib/firebase'
import { stripUndefined } from '../lib/firestoreSafe'
import type { ResumeData } from '../types'
import {
  buildDesignerPortfolio,
  defaultPortfolioSettings,
  type PortfolioData,
  type PortfolioDoc,
} from './types'
import { buildDesignerPage } from './canvas/seed'

const LOCAL_KEY = 'rjresume:portfolio'

function isValid(d: unknown): d is PortfolioData {
  if (!d || typeof d !== 'object') return false
  const v = d as Partial<PortfolioData>
  return Array.isArray(v.blocks) && typeof v.settings === 'object'
}

// Fill any missing settings (older saved data) with current defaults so the
// renderer never hits an undefined field.
function migrate(d: PortfolioData): PortfolioData {
  return {
    ...d,
    settings: { ...defaultPortfolioSettings, ...d.settings },
    styles: d.styles ?? {},
  }
}

function readLocal(): PortfolioData | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PortfolioDoc
    return isValid(parsed.data) ? migrate(parsed.data) : null
  } catch {
    return null
  }
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'too-big'

// Firestore rejects documents larger than ~1 MiB. We keep a small safety margin.
const FIRESTORE_DOC_LIMIT = 1_000_000

// Build the full seed: legacy blocks (for migration safety) + new page document.
function seed(resume: ResumeData): PortfolioData {
  return { ...buildDesignerPortfolio(resume), page: buildDesignerPage(resume) }
}

// Manages portfolio data. Seeds from the resume on first use.
export function usePortfolio(user: User | null, resume: ResumeData) {
  const [data, setData] = useState<PortfolioData>(() => readLocal() ?? seed(resume))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const loadedForUid = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fs = db
    if (!user || !fs || loadedForUid.current === user.uid) return
    loadedForUid.current = user.uid
    ;(async () => {
      try {
        const snap = await getDoc(doc(fs, 'portfolios', user.uid))
        if (snap.exists()) {
          const d = snap.data() as PortfolioDoc
          if (isValid(d.data)) setData(migrate(d.data))
        }
      } catch (e) {
        console.error('Failed to load portfolio', e)
      }
    })()
  }, [user])

  useEffect(() => {
    const docToSave: PortfolioDoc = { data, updatedAt: Date.now() }
    const serialized = JSON.stringify(docToSave)
    // Always keep the local copy (the work is never lost even if cloud save fails).
    try {
      localStorage.setItem(LOCAL_KEY, serialized)
    } catch {
      /* ignore quota */
    }
    const fs = db
    if (!user || !fs) return

    const tooBig = serialized.length > FIRESTORE_DOC_LIMIT
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      // Firestore caps documents at ~1 MiB. Inline images blow past that
      // quickly, so detect it and tell the user instead of a generic failure.
      if (tooBig) {
        setSaveState('too-big')
        setSaveError(
          `Your portfolio is ${(serialized.length / 1_000_000).toFixed(
            2,
          )} MB — over the 1 MB cloud-save limit. It's saved on this device, but remove or shrink some images to sync it to your account.`,
        )
        return
      }
      setSaveState('saving')
      try {
        await setDoc(doc(fs, 'portfolios', user.uid), stripUndefined(docToSave))
        setSaveState('saved')
        setSaveError(null)
      } catch (e) {
        console.error('Failed to save portfolio', e)
        setSaveState('error')
        setSaveError(e instanceof Error ? e.message : 'Could not save to the cloud.')
      }
    }, 800)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data, user])

  // Reset rebuilds the page from the Designer template but KEEPS the user's
  // saved web blocks (library) and contact email.
  const resetFromResume = useCallback(
    () =>
      setData((prev) => {
        const fresh = seed(resume)
        return {
          ...fresh,
          settings: { ...fresh.settings, contactEmail: prev.settings.contactEmail || fresh.settings.contactEmail },
          blockLibrary: prev.blockLibrary ?? fresh.blockLibrary,
          libraryStyles: prev.libraryStyles ?? fresh.libraryStyles,
        }
      }),
    [resume],
  )

  return { data, setData, saveState, saveError, resetFromResume, defaults: defaultPortfolioSettings }
}
