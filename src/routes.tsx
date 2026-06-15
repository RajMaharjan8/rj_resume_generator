import { createBrowserRouter } from 'react-router-dom'
import Layout from './pages/Layout'
import ResumePage from './pages/ResumePage'
import PortfolioPage from './pages/PortfolioPage'

// App routes. The Layout renders the top bar + shared modals around an <Outlet>.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ResumePage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
    ],
  },
])
