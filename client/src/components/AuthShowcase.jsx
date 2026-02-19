import { Briefcase, Sparkles, LineChart, CheckCircle2, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AuthShowcase({ mode = 'login' }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const goToAuth = () => {
    navigate(isLogin ? '/signup' : '/login')
  }

  return (
    <div className="relative hidden lg:flex min-h-screen flex-col justify-between overflow-hidden border-l border-[var(--color-card-border)] bg-[var(--color-bg-soft)] p-10">
      <div className="pointer-events-none absolute -top-10 right-8 h-52 w-52 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
          <Sparkles size={16} className="text-[var(--color-brand)]" />
          JobPilot AI
        </div>

        <h2 className="mt-6 max-w-md text-4xl font-bold leading-tight text-[var(--color-text)]">
          Track every job move with confidence.
        </h2>
        <p className="mt-4 max-w-md text-[var(--color-text-muted)]">
          Resume intelligence, JD parsing, and shortlisting insights in one focused workflow.
        </p>

        <button
          type="button"
          onClick={goToAuth}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-[var(--color-brand-hover)]"
        >
          <Lock size={16} />
          {isLogin ? 'Create account to unlock' : 'Sign in to continue'}
        </button>
      </div>

      <div className="relative space-y-4">
        <button
          type="button"
          onClick={goToAuth}
          className="w-full rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--color-brand)] p-2 text-white">
              <LineChart size={18} />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Application Success</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">34%</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Click to {isLogin ? 'sign up' : 'sign in'} and see your own dashboard metrics.
          </p>
        </button>

        <button
          type="button"
          onClick={goToAuth}
          className="w-full rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-500/15 p-2 text-teal-500">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">Frontend Developer</p>
                <p className="text-sm text-[var(--color-text-muted)]">Nexora Labs</p>
              </div>
            </div>
            <span className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-500">
              Interview
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <CheckCircle2 size={16} className="text-teal-500" />
            Resume matched with role requirements
          </div>
        </button>
      </div>
    </div>
  )
}
