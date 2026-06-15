import { createBrowserRouter } from 'react-router-dom'
import Layout from './pages/Layout'
import LandingPage from './pages/LandingPage'
import ResumePage from './pages/ResumePage'
import PortfolioPage from './pages/PortfolioPage'

// App routes. "/" is a simple landing page where the user picks a tool. The
// Layout (top bar + shared modals) wraps the resume and portfolio builders.
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <Layout />,
    children: [
      { path: 'resume', element: <ResumePage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
    ],
  },
])
