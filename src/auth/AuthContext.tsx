import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider, firebaseEnabled } from '../lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  enabled: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // If Firebase isn't configured there is no auth state to wait for.
  const [loading, setLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) {
      alert('Firebase is not configured. Add your config to .env.local — see README.')
      return
    }
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      // Don't alert on the user simply closing the popup.
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return
      }
      console.error('Google sign-in error:', err.code, err.message)
      alert(`Sign-in failed: ${err.code ?? err.message ?? 'unknown error'}`)
      throw e
    }
  }

  const signOut = async () => {
    if (!auth) return
    await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, enabled: firebaseEnabled, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
