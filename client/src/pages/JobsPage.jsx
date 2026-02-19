import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useJobs, useLocationSuggestions } from '../api/queries'
import { CardSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import { Briefcase, MapPin, ExternalLink } from 'lucide-react'
import Layout from '../components/Layout'

export default function JobsPage() {
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    status: '',
  })
  const [searchParams] = useSearchParams()

  const [page, setPage] = useState(1)
  const limit = 10
  const navigate = useNavigate()
  const { data: locationSuggestions = [] } = useLocationSuggestions(
    filters.location
  )

  const { data: jobs, isLoading } = useJobs({
    ...filters,
    page,
    limit,
  })

  /* ================= FILTERS ================= */
  useEffect(() => {
    const status = searchParams.get('status') || ''
    if (status && ['Saved', 'Applied', 'Interview', 'Rejected', 'Offer'].includes(status)) {
      setFilters((prev) => ({ ...prev, status }))
    }
  }, [searchParams])

  const handleSearch = (e) => {
    setPage(1)
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }))
  }

  const handleLocationFilter = (e) => {
    setPage(1)
    setFilters((prev) => ({
      ...prev,
      location: e.target.value,
    }))
  }

  const handleStatusFilter = (e) => {
    setPage(1)
    setFilters((prev) => ({
      ...prev,
      status: e.target.value,
    }))
  }

  /* ================= NORMALIZE ================= */

  const jobsList = useMemo(() => {
    if (!jobs) return []
    return jobs.data || jobs.jobs || []
  }, [jobs])

  const totalPages = jobs?.total
    ? Math.ceil(jobs.total / limit)
    : 1

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--color-text)]">
              Job Opportunities
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Track and manage your applications
            </p>
          </div>

          <button
            onClick={() => navigate('/jobs/new')}
            className="btn-primary"
          >
            + Add Job
          </button>
        </div>

        {/* ===== FILTER BAR ===== */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by role or company..."
              value={filters.search}
              onChange={handleSearch}
              className="input-field"
            />

            <input
              type="text"
              placeholder="Filter by location..."
              value={filters.location}
              onChange={handleLocationFilter}
              list="jobs-location-suggestions"
              className="input-field"
            />
            <datalist id="jobs-location-suggestions">
              {locationSuggestions.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>

            <select
              value={filters.status}
              onChange={handleStatusFilter}
              className="input-field"
            >
              <option value="">All statuses</option>
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer">Offer</option>
            </select>
          </div>
        </div>

        {/* ===== JOB LIST ===== */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : jobsList.length > 0 ? (
            jobsList.map((job) => {
              const title = job.role || job.title
              const company = job.companyName || job.company
              const location = job.location || ''
              const salaryMin =
                job.salary_min ?? job.salaryMin

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
                  className="card group cursor-pointer hover:-translate-y-0.5 hover:border-emerald-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* LEFT */}
                    <div className="flex flex-1 gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-bold text-emerald-400">
                        {String(company || 'C').slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)] transition-colors group-hover:text-emerald-400 truncate max-w-[30rem]">
                          {title}
                        </h2>

                        <p className="text-[var(--color-text-muted)] font-medium truncate max-w-[30rem]">
                          {company}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                          {location && (
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              {location}
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Briefcase size={16} />
                            {job.status || 'Applied'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3">
                      {salaryMin != null && (
                        <div className="text-right">
                          <p className="text-sm text-[var(--color-text-muted)]">
                            Salary
                          </p>
                          <p className="font-semibold text-emerald-400">
                            ${salaryMin.toLocaleString()}
                          </p>
                        </div>
                      )}

                      <Link
                        to={`/jobs/${job._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-secondary"
                      >
                        View
                      </Link>

                      {job.jobLink && (
                        <a
                          href={job.jobLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary flex items-center gap-2"
                        >
                          Apply
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyState
              title="No jobs found"
              description="Start by adding your first job application"
            />
          )}
        </div>

        {/* ===== PAGINATION ===== */}
        {jobs && jobs.total > limit && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
              className="btn-secondary"
              disabled={page === 1}
            >
              Previous
            </button>

            <div className="text-sm text-[var(--color-text-muted)]">
              Page {jobs.page || page} of {totalPages}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary"
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
