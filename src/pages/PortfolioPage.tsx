import { useWorkspace } from '../WorkspaceContext'
import { useAuth } from '../auth/AuthContext'
import CanvasBuilder from '../portfolio/canvas/CanvasBuilder'
import PortfolioGate from './PortfolioGate'

export default function PortfolioPage() {
  const { portfolio, resume } = useWorkspace()
  const { user, loading } = useAuth()

  // Portfolio data is stored per-user in Firestore, so the builder requires
  // sign-in. Avoid flashing the gate while auth state is still resolving.
  if (loading) return null
  if (!user) return <PortfolioGate />

  return (
    <CanvasBuilder
      data={portfolio.data}
      onChange={portfolio.setData}
      resume={resume.data}
    />
  )
}
