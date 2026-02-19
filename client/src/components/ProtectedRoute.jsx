import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CardSkeleton } from './Skeletons'

export const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth()

  // 🔹 While auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardSkeleton />
      </div>
    )
  }

  // 🔹 If not logged in → redirect
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth()

  // 🔹 While checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardSkeleton />
      </div>
    )
  }

  // 🔹 If already logged in → go dashboard
  if (token) {
    return <Navigate to="/" replace />
  }

  return children
}
