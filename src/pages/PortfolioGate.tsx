import { useAuth } from '../auth/AuthContext'
import { GoogleIcon, BlocksIcon } from '../components/atoms/icons'

// Inline empty-state shown on the Portfolio page when the user isn't signed in.
// Portfolio content (including inline images) is saved per-user in Firestore, so
// the builder is gated behind authentication.
export default function PortfolioGate() {
  const { signInWithGoogle, enabled } = useAuth()

  return (
    <div className="portfolio-gate">
      <div className="portfolio-gate-card">
        <BlocksIcon className="portfolio-gate-icon" />
        <h2>Sign in to build your portfolio</h2>
        <p className="prompt-text">
          Your portfolio and its images are saved to your account so you can pick up where you left
          off on any device. Sign in with Google to start building.
        </p>
        <button type="button" className="btn google block-btn" onClick={signInWithGoogle}>
          <GoogleIcon /> Continue with Google
        </button>
        {!enabled && (
          <p className="fl-hint" style={{ marginTop: 10 }}>
            Firebase isn’t configured yet — see the README to enable Google sign-in.
          </p>
        )}
      </div>
    </div>
  )
}
