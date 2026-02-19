import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function OAuthSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const encodedUser = params.get('user')

    if (!token || !encodedUser) {
      toast.error('Google login failed. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    try {
      const decoded = atob(decodeURIComponent(encodedUser))
      const user = JSON.parse(decoded)
      login(user, token)
      toast.success('Logged in with Google')
      navigate('/', { replace: true })
    } catch {
      toast.error('Google login failed. Please try again.')
      navigate('/login', { replace: true })
    }
  }, [location.search, login, navigate, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md text-center">
        <p className="text-lg font-semibold">Signing you in with Google...</p>
      </div>
    </div>
  )
}

