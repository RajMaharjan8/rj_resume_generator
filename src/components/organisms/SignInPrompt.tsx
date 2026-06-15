import Modal from '../atoms/Modal'
import { useAuth } from '../../auth/AuthContext'
import { GoogleIcon } from '../atoms/icons'

interface Props {
  onClose: () => void
  // Called after a successful sign-in, so the caller can proceed (e.g. open the
  // create-block modal).
  onSignedIn: () => void
}

export default function SignInPrompt({ onClose, onSignedIn }: Props) {
  const { signInWithGoogle, enabled } = useAuth()

  const handle = async () => {
    try {
      await signInWithGoogle()
      onSignedIn()
    } catch (e) {
      console.error('Sign-in failed', e)
    }
  }

  return (
    <Modal title="Sign in to create blocks" onClose={onClose} size="sm">
      <p className="prompt-text">
        Creating custom blocks is saved to your account so you can reuse them next time. Sign in
        with Google to continue.
      </p>
      <button type="button" className="btn google block-btn" onClick={handle}>
        <GoogleIcon /> Continue with Google
      </button>
      {!enabled && (
        <p className="fl-hint" style={{ marginTop: 10 }}>
          Firebase isn’t configured yet — see the README to enable Google sign-in.
        </p>
      )}
    </Modal>
  )
}
