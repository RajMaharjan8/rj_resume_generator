import { useWorkspace } from '../WorkspaceContext'
import CanvasBuilder from '../portfolio/canvas/CanvasBuilder'

export default function PortfolioPage() {
  const { portfolio, resume } = useWorkspace()
  return (
    <CanvasBuilder
      data={portfolio.data}
      onChange={portfolio.setData}
      resume={resume.data}
    />
  )
}
