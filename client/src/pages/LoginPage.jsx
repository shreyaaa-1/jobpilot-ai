import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader } from 'lucide-react'
import { useEffect } from 'react'
import { loginSchema } from '../utils/validation'
import { useAuth } from '../context/AuthContext'
import { useLogin } from '../api/queries'
import { FormInput } from '../components/FormInputs'
import { useToast } from '../components/Toast'
import AuthShowcase from '../components/AuthShowcase'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { login } = useAuth()
  const { mutate, isPending } = useLogin()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data) => {
    if (isPending) return

    mutate(data, {
      onSuccess: (response) => {
        const { token, user } = response?.data || {}

        if (!token) {
          toast.error('Invalid server response')
          return
        }

        login(user, token)
        toast.success('Login successful!')
        navigate('/')
      },
      onError: (error) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Login failed'
        toast.error(message)
      },
    })
  }

  const handleGoogleLogin = () => {
    const width = 520
    const height = 650
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const popup = window.open(
      `${apiOrigin}/api/auth/google?popup=1`,
      'jobpilot-google-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    )
    if (!popup) toast.error('Popup blocked. Please allow popup for Google login.')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oauthError = params.get('oauthError')
    if (oauthError) {
      toast.error('Google login failed. Please try again.')
      navigate('/login', { replace: true })
    }
  }, [location.search, navigate, toast])

  useEffect(() => {
    const onMessage = (event) => {
      if (!event.origin.includes('onrender.com')) return
      if (event.data?.source !== 'jobpilot-google-oauth') return
      if (event.data?.error) {
        if (event.data.error === 'oauth_not_configured') {
          toast.error('Google login not configured on server. Add Google env keys.')
        } else {
          toast.error('Google login failed. Please try again.')
        }
        return
      }
      const token = event.data?.token
      const encodedUser = event.data?.user
      if (!token || !encodedUser) {
        toast.error('Google login failed. Please try again.')
        return
      }
      try {
        const user = JSON.parse(atob(decodeURIComponent(encodedUser)))
        login(user, token)
        toast.success('Login successful!')
        navigate('/', { replace: true })
      } catch {
        toast.error('Google login failed. Please try again.')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [apiOrigin, login, navigate, toast])

  return (
    <div className="auth-shell grid min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center px-4 py-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-35" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="card relative w-full max-w-md p-7">
          <h1 className="mb-2 text-3xl font-bold text-[var(--color-text)]">
            Welcome back
          </h1>
          <p className="mb-7 text-[var(--color-text-muted)]">
            Sign in to continue tracking your job applications.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormInput
              label="Email"
              type="email"
              autoFocus
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email}
            />

            <FormInput
              label="Password"
              type="password"
              placeholder="********"
              {...register('password')}
              error={errors.password}
            />

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
              aria-busy={isPending}
            >
              {isPending && (
                <Loader size={18} className="animate-spin" />
              )}
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn-secondary w-full"
            >
              Continue with Google
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="auth-label text-[var(--color-text-muted)]">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-brand font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthShowcase mode="login" />
    </div>
  )
}
