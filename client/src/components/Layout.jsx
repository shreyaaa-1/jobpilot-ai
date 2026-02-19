import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Briefcase,
} from 'lucide-react'
import { ThemeToggle } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout: authLogout } = useAuth()
  const toast = useToast()

  const handleLogout = () => {
    authLogout()
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Jobs', href: '/jobs', icon: Briefcase },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-[var(--color-card-border)] bg-[var(--color-sidebar-bg)] transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0`}
      >
        <div className="border-b border-[var(--color-card-border)] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--color-brand)] p-2.5 text-white shadow-lg shadow-teal-600/25">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-[1.45rem] font-extrabold tracking-tight text-[var(--color-text)]">JobPilot AI</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Smart Job Tracker</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all
                ${
                  isActive(item.href)
                    ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-500/55 dark:bg-teal-500/30 dark:text-teal-100'
                    : 'text-slate-700 hover:bg-[var(--color-bg)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 border-t border-[var(--color-card-border)] pt-6">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-white shadow-sm transition hover:-translate-y-px hover:bg-[var(--color-brand-hover)]"
          >
            <span className="inline-flex items-center justify-center gap-2 font-medium">
              <LogOut size={18} />
              Logout
            </span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-16 border-b border-[var(--color-card-border)] bg-[var(--color-sidebar-bg)] px-4 md:px-6">
          <div className="flex h-full items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg)] md:hidden"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="flex-1" />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--color-bg)]">
          <div className="p-5 md:p-7 lg:p-8" onClick={() => setSidebarOpen(false)}>
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
