import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { WorkspaceProvider } from './WorkspaceContext'
import { router } from './routes'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <RouterProvider router={router} />
      </WorkspaceProvider>
    </AuthProvider>
  )
}
