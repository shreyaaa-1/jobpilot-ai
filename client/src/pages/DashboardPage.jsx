import { useAuth } from '../context/AuthContext'
import { useJobs, useJobStats } from '../api/queries'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Briefcase, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'

export default function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)

  const { data: jobs, isLoading } = useJobs({ limit: 200 })
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
    refetch,
  } = useJobStats()

  useEffect(() => {
    if (statsError) {
      toast.error(statsErrorObj?.response?.data?.message || 'Failed to load stats')
    }
  }, [statsError, statsErrorObj, toast])

  const jobsList = useMemo(() => {
    if (!jobs) return []
    return jobs.data || jobs.jobs || []
  }, [jobs])

  const recentJobs = useMemo(() => jobsList.slice(0, 5), [jobsList])

  const chartData = useMemo(() => {
    if (!jobsList.length) return []

    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString('default', { month: 'short' })
      const key = `${label} ${d.getFullYear()}`
      months.push({ key, label, timestamp: d.getTime(), applications: 0, matches: 0 })
    }

    const map = Object.fromEntries(months.map((m) => [m.key, { ...m }]))
    jobsList.forEach((job) => {
      const dateStr = job.createdAt || job.appliedDate
      if (!dateStr) return
      const d = new Date(dateStr)
      const label = d.toLocaleString('default', { month: 'short' })
      const key = `${label} ${d.getFullYear()}`
      if (!map[key]) return
      map[key].applications += 1
      if (job.status === 'Interview' || job.status === 'Offer') map[key].matches += 1
    })

    return Object.values(map).sort((a, b) => a.timestamp - b.timestamp)
  }, [jobsList])

  const selectedMonthJobs = useMemo(() => {
    if (!selectedMonthKey) return []
    return jobsList.filter((job) => {
      const dateStr = job.createdAt || job.appliedDate
      if (!dateStr) return false
      const d = new Date(dateStr)
      const label = d.toLocaleString('default', { month: 'short' })
      const key = `${label} ${d.getFullYear()}`
      return key === selectedMonthKey
    })
  }, [jobsList, selectedMonthKey])

  const totalApplications = useMemo(() => {
    if (!stats) return 0
    return Object.values(stats).reduce((s, v) => s + (v || 0), 0)
  }, [stats])

  const matchesCount = useMemo(() => (stats?.Interview || 0) + (stats?.Offer || 0), [stats])

  const successRate = useMemo(() => {
    if (!totalApplications) return '0%'
    return `${Math.round(((stats?.Offer || 0) / totalApplications) * 100)}%`
  }, [stats, totalApplications])

  const activeJobs = selectedMonthKey ? selectedMonthJobs : recentJobs

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-teal-300 bg-gradient-to-r from-slate-800 via-teal-800 to-cyan-800 p-7 shadow-[0_14px_40px_rgba(15,23,42,0.22)] dark:border-teal-500/45 dark:from-slate-900 dark:via-teal-900 dark:to-cyan-900">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
          <h1 className="text-4xl font-bold text-white">
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="mt-1 text-teal-100/90">
            Here is what is happening with your job search
          </p>
        </div>

        {statsError && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Failed to load statistics</h3>
                <p className="text-sm text-[var(--color-text-muted)]">There was an error fetching dashboard data.</p>
              </div>
              <button onClick={() => refetch()} className="btn-secondary">
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="card flex items-center justify-between text-left transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Total Applications</p>
              <p className="text-3xl font-semibold mt-2">
                {statsLoading ? <div className="skeleton h-8 w-20" /> : totalApplications}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/15">
              <Briefcase className="text-teal-400" size={22} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/jobs?status=Interview')}
            className="card flex items-center justify-between text-left transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Matches</p>
              <p className="text-xs text-[var(--color-text-muted)]">Interview + Offer</p>
              <p className="text-3xl font-semibold mt-2">
                {statsLoading ? <div className="skeleton h-8 w-12" /> : matchesCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/15">
              <TrendingUp className="text-cyan-400" size={22} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/jobs?status=Offer')}
            className="card flex items-center justify-between text-left transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Success Rate</p>
              <p className="text-xs text-[var(--color-text-muted)]">Offers / Total applications</p>
              <p className="text-3xl font-semibold mt-2">
                {statsLoading ? <div className="skeleton h-8 w-12" /> : successRate}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/15">
              <TrendingUp className="text-teal-400" size={22} />
            </div>
          </button>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Application Trends</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Monthly applications and matches in the last 6 months</p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-[var(--color-text-muted)]">
              No data yet - start adding jobs
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(state) => {
                  const payload = state?.activePayload?.[0]?.payload
                  if (payload?.key) setSelectedMonthKey(payload.key)
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f5568" />
                <XAxis dataKey="label" tick={{ fill: '#8ea0b1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8ea0b1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(13,148,136,0.12)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    borderRadius: '10px',
                    color: 'var(--color-text)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="applications" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={36} />
                <Bar dataKey="matches" fill="#0891b2" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              {selectedMonthKey ? `Applications in ${selectedMonthKey}` : 'Recent Jobs'}
            </h2>
            {selectedMonthKey && (
              <button type="button" className="btn-secondary" onClick={() => setSelectedMonthKey(null)}>
                Show Recent
              </button>
            )}
          </div>

          {isLoading ? (
            <CardSkeleton />
          ) : activeJobs.length > 0 ? (
            <div className="space-y-4">
              {activeJobs.map((job) => {
                const title = job.role || job.title
                const company = job.companyName || job.company
                const salaryMin = job.salary_min ?? job.salaryMin
                const location = job.location || ''

                return (
                  <div
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/jobs/${job._id}`)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-xl border border-[var(--color-card-border)] p-4 transition hover:bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-[var(--color-text)] truncate max-w-[28rem]">{title}</h3>
                        <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[28rem]">
                          {company}
                          {location ? ` | ${location}` : ''}
                        </p>
                      </div>
                      {salaryMin != null && (
                        <span className="text-teal-400 font-semibold">${salaryMin.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title={selectedMonthKey ? `No applications in ${selectedMonthKey}` : 'No jobs found'}
              description={selectedMonthKey ? 'Try another month on the chart.' : 'Start tracking your applications'}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

