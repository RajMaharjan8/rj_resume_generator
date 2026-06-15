import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../useTheme'
import { FileIcon, LayoutIcon, GoogleIcon, MoonIcon, SunIcon } from '../components/atoms/icons'
import Footer from '../components/atoms/Footer'

// Simple entry page: the user picks whether to build a resume or a portfolio.
// Replaces dropping the user straight into the resume editor.
export default function LandingPage() {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  // Apply the saved theme here too — the Layout (which normally sets it) isn't
  // mounted on this route, so without this the landing page is always light.
  const { theme, toggle } = useTheme()

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand">
          <FileIcon className="logo" />
          <span className="brand-name">RJResume</span>
        </div>
        <div className="landing-top-actions">
          <button
            className="btn ghost icon-only"
            onClick={toggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {!loading &&
            (user ? (
              <div className="user">
                {user.photoURL && <img src={user.photoURL} alt="" className="avatar" />}
                <span className="user-name">{user.displayName ?? user.email}</span>
                <button className="btn ghost small" onClick={signOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <button className="btn google" onClick={signInWithGoogle}>
                <GoogleIcon /> Sign in
              </button>
            ))}
        </div>
      </header>

      <main className="landing-main">
        <h1 className="landing-title">Build something to land your next role.</h1>
        <p className="landing-sub">
          Craft a polished resume or a personal portfolio site — free, in your browser.
        </p>

        <div className="landing-cards">
          <button type="button" className="landing-card" onClick={() => navigate('/resume')}>
            <FileIcon className="landing-card-icon" />
            <span className="landing-card-title">Build a Resume</span>
            <span className="landing-card-desc">
              Clean templates, live preview, one-click PDF.
            </span>
            <span className="landing-card-cta">Create resume →</span>
          </button>

          <button type="button" className="landing-card" onClick={() => navigate('/portfolio')}>
            <LayoutIcon className="landing-card-icon" />
            <span className="landing-card-title">Build a Portfolio</span>
            <span className="landing-card-desc">
              A drag-and-drop personal site, saved to your account.
            </span>
            <span className="landing-card-cta">Create portfolio →</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
