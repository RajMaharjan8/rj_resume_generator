import { useWorkspace } from '../WorkspaceContext'
import { useAuth } from '../auth/AuthContext'
import CanvasBuilder from '../portfolio/canvas/CanvasBuilder'

export default function PortfolioPage() {
  const { portfolio, resume } = useWorkspace()
  const { user, loading } = useAuth()

  // Avoid flashing UI while auth state is still resolving.
  if (loading) return null

  // The builder is open to everyone. Signed-out work lives only in this
  // browser (localStorage) and isn't synced to an account — CanvasBuilder
  // shows a banner saying so, with a sign-in CTA.
  return (
    <CanvasBuilder
      data={portfolio.data}
      onChange={portfolio.setData}
      resume={resume.data}
      signedIn={!!user}
    />
  )
}
