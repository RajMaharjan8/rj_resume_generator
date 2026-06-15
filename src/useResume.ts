import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './lib/firebase'
import { stripUndefined } from './lib/firestoreSafe'
import {
  buildSample,
  defaultSettings,
  SCHEMA_VERSION,
  type ResumeData,
  type ResumeDoc,
  type ResumeSettings,
} from './types'

const LOCAL_KEY = 'rjresume:doc'

// A v2 doc has data.blocks (array) and data.header. Older/invalid docs are
// discarded — we fall back to the sample rather than crash the renderer.
function isValidData(d: unknown): d is ResumeData {
  if (!d || typeof d !== 'object') return false
  const v = d as Partial<ResumeData>
  return Array.isArray(v.blocks) && typeof v.header === 'object' && v.header !== null
}

function coerceDoc(raw: unknown): { data: ResumeData; settings: ResumeSettings } | null {
  if (!raw || typeof raw !== 'object') return null
  const doc = raw as Partial<ResumeDoc>
  if (!isValidData(doc.data)) return null
  return {
    data: doc.data,
    settings: { ...defaultSettings, ...(doc.settings ?? {}) },
  }
}

function readLocal(): { data: ResumeData; settings: ResumeSettings } | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? coerceDoc(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function writeLocal(d: ResumeDoc) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(d))
  } catch {
    /* ignore quota errors */
  }
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'too-big'

// Firestore rejects documents larger than ~1 MiB. Keep a small safety margin.
const FIRESTORE_DOC_LIMIT = 1_000_000

export function useResume(user: User | null) {
  const initial = readLocal()
  const [data, setData] = useState<ResumeData>(() => initial?.data ?? buildSample())
  const [settings, setSettings] = useState<ResumeSettings>(initial?.settings ?? defaultSettings)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const loadedForUid = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the signed-in user's saved resume from Firestore once per uid.
  useEffect(() => {
    const fs = db
    if (!user || !fs || loadedForUid.current === user.uid) return
    loadedForUid.current = user.uid
    ;(async () => {
      try {
        const snap = await getDoc(doc(fs, 'resumes', user.uid))
        if (snap.exists()) {
          const coerced = coerceDoc(snap.data())
          if (coerced) {
            setData(coerced.data)
            setSettings(coerced.settings)
          }
        }
      } catch (e) {
        console.error('Failed to load resume', e)
      }
    })()
  }, [user])

  // Persist to localStorage immediately, and debounce-save to Firestore.
  useEffect(() => {
    const docToSave: ResumeDoc = { data, settings, updatedAt: Date.now(), version: SCHEMA_VERSION }
    writeLocal(docToSave)

    const fs = db
    if (!user || !fs) return
    const tooBig = JSON.stringify(docToSave).length > FIRESTORE_DOC_LIMIT
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      // Firestore caps documents at ~1 MiB; inline images blow past that quickly.
      if (tooBig) {
        setSaveState('too-big')
        setSaveError(
          'Your resume is over the 1 MB cloud-save limit (usually large photos). ' +
            "It's saved on this device, but shrink/remove images to sync it to your account.",
        )
        return
      }
      setSaveState('saving')
      try {
        await setDoc(doc(fs, 'resumes', user.uid), stripUndefined(docToSave))
        setSaveState('saved')
        setSaveError(null)
      } catch (e) {
        console.error('Failed to save resume', e)
        setSaveState('error')
        setSaveError(e instanceof Error ? e.message : 'Could not save to the cloud.')
      }
    }, 800)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data, settings, user])

  const reset = useCallback(() => {
    // Reset sections to a fresh sample, but KEEP the user's saved block library.
    setData((prev) => ({ ...buildSample(), blockLibrary: prev.blockLibrary }))
    setSettings({ ...defaultSettings })
  }, [])

  return { data, setData, settings, setSettings, saveState, saveError, reset }
}
