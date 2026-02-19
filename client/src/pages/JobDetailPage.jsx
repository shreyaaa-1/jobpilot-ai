import { useParams, useNavigate } from 'react-router-dom'
import {
  useJobById,
  useUpdateJob,
  useDeleteJob,
  useApplyToJob,
  useAIAnalyzeUpload,
} from '../api/queries'
import { useEffect, useState } from 'react'
import { CardSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import { useToast } from '../components/Toast'
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import Layout from '../components/Layout'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [nextStatus, setNextStatus] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [savedResumeFileName, setSavedResumeFileName] = useState('')
  const [jobDescriptionInput, setJobDescriptionInput] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    role: '',
    companyName: '',
    location: '',
    notes: '',
    jobLink: '',
  })

  const { data: job, isLoading, error } = useJobById(id)
  const { mutate: updateJob, isPending: isUpdating } = useUpdateJob()
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob()
  const { mutate: applyToJob, isPending: isApplying } = useApplyToJob()
  const { mutate: analyzeResumeUpload, isPending: isUploadingAnalysis } =
    useAIAnalyzeUpload()

  useEffect(() => {
    const jobInfo = job?.data || job
    if (!jobInfo) return

    if (jobInfo.resumeText && !resumeText) {
      setResumeText(jobInfo.resumeText)
    }
    if (jobInfo.resumeFileName) {
      setSavedResumeFileName(jobInfo.resumeFileName)
    }

    setEditForm({
      role: jobInfo.role || '',
      companyName: jobInfo.companyName || '',
      location: jobInfo.location || '',
      notes: jobInfo.notes || '',
      jobLink: jobInfo.jobLink || '',
    })
  }, [job])

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <CardSkeleton />
        </div>
      </Layout>
    )
  }

  /* ================= ERROR ================= */

  if (error || !job) {
    toast.error('Failed to load job')

    return (
      <Layout>
        <EmptyState
          title="Job not found"
          description="This job opportunity might have been removed"
          action={
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="btn-primary"
            >
              Back to jobs
            </button>
          }
        />
      </Layout>
    )
  }

  /* ================= NORMALIZE ================= */

  const jobData = job.data || job
  const currentStatus = jobData.status || 'Saved'

  const title = jobData.role || jobData.title
  const company = jobData.companyName || jobData.company
  const description =
    jobData.notes || jobData.description || ''

  const salaryMin = jobData.salary_min ?? jobData.salaryMin
  const salaryMax = jobData.salary_max ?? jobData.salaryMax

  const posted =
    jobData.appliedDate ||
    jobData.postedDate ||
    jobData.createdAt

  const location = jobData.location?.trim() || 'Not specified'

  const salaryText =
    salaryMin != null && salaryMax != null
      ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`
      : salaryMin != null
      ? `From $${salaryMin.toLocaleString()}`
      : 'Not specified'

  const requirementsList =
    typeof jobData.requirements === 'string'
      ? jobData.requirements
          .split('\n')
          .filter((r) => r.trim())
      : []

  /* ================= APPLY ================= */

  const handleApply = () => {
    if (!jobData.jobLink) {
      toast.info('Application link not available')
      return
    }

    applyToJob(id, {
      onSuccess: (response) => {
        const link = response?.data?.data?.jobLink || jobData.jobLink
        window.open(link, '_blank', 'noopener,noreferrer')
        toast.success('Application link opened')
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message || 'Failed to open application link'
        )
      },
    })
  }

  const handleAnalyzeResumeFile = () => {
    if (!resumeFile) {
      toast.info('Please upload a resume PDF or DOCX file first')
      return
    }

    const formData = new FormData()
    formData.append('resumeFile', resumeFile)
    formData.append('jobDescription', jobDescriptionInput || '')
    formData.append('jobLink', jobData.jobLink || '')
    formData.append('role', title || '')
    formData.append('companyName', company || '')
    formData.append(
      'requiredSkills',
      Array.isArray(jobData.requiredSkills)
        ? jobData.requiredSkills.join(',')
        : ''
    )

    analyzeResumeUpload(formData, {
      onSuccess: (response) => {
        setAnalysis(response.data)
        if (response?.data?.resumeText) {
          setResumeText(response.data.resumeText)
        }
        if (response?.data?.resumeFileName) {
          setSavedResumeFileName(response.data.resumeFileName)
        }
        updateJob({
          jobId: id,
          data: {
            resumeText: response?.data?.resumeText || '',
            resumeFileName: response?.data?.resumeFileName || '',
            lastMatchScore: response?.data?.matchScore ?? null,
          },
        })
        toast.success('Resume file analyzed successfully')
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message || 'Failed to analyze resume file'
        )
      },
    })
  }

  const handleClearSavedResume = () => {
    setResumeText('')
    setResumeFile(null)
    setSavedResumeFileName('')
    updateJob(
      {
        jobId: id,
        data: {
          resumeText: '',
          resumeFileName: '',
          lastMatchScore: null,
        },
      },
      {
        onSuccess: () => toast.success('Saved resume cleared'),
      }
    )
  }

  const handleSaveEdit = () => {
    updateJob(
      {
        jobId: id,
        data: {
          role: editForm.role,
          companyName: editForm.companyName,
          location: editForm.location,
          notes: editForm.notes,
          jobLink: editForm.jobLink,
        },
      },
      {
        onSuccess: () => {
          setIsEditMode(false)
          toast.success('Job updated')
        },
      }
    )
  }

  const handleStatusUpdate = () => {
    if (!nextStatus || nextStatus === currentStatus) {
      return
    }

    updateJob(
      {
        jobId: id,
        data: { status: nextStatus },
      },
      {
        onSuccess: () => {
          toast.success('Status updated')
          setNextStatus('')
        },
        onError: (err) => {
          toast.error(
            err?.response?.data?.message || 'Failed to update status'
          )
        },
      }
    )
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Delete this job application permanently?'
    )

    if (!confirmed) return

    deleteJob(id, {
      onSuccess: () => {
        toast.success('Job deleted')
        navigate('/jobs')
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message || 'Failed to delete job'
        )
      },
    })
  }

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-brand hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          Back to jobs
        </button>

        <div className="card">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h1 className="truncate text-3xl font-bold">{title}</h1>
              <button
                type="button"
                onClick={() => setIsEditMode((s) => !s)}
                className="btn-secondary"
              >
                {isEditMode ? 'Cancel Edit' : 'Edit Job'}
              </button>
            </div>
            <p className="truncate text-xl text-[var(--color-text-muted)]">
              {company}
            </p>
          </div>

          {isEditMode && (
            <div className="mb-8 grid gap-3 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-bg-soft)] p-4">
              <input
                className="input-field"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="Role"
              />
              <input
                className="input-field"
                value={editForm.companyName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                placeholder="Company"
              />
              <input
                className="input-field"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="Location"
              />
              <input
                className="input-field"
                value={editForm.jobLink}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    jobLink: e.target.value,
                  }))
                }
                placeholder="Job link"
              />
              <textarea
                className="input-field"
                rows={4}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Description / Requirements"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn-primary"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-[var(--color-card-border)]">
            <div>
              <p className="text-[var(--color-text-muted)] text-sm mb-1">
                Location
              </p>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span className="font-medium">{location}</span>
              </div>
            </div>

            <div>
              <p className="text-[var(--color-text-muted)] text-sm mb-1">
                Job Type
              </p>
              <div className="flex items-center gap-2">
                <Briefcase size={18} />
                <span className="font-medium">
                  {jobData.job_type || 'Full-time'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[var(--color-text-muted)] text-sm mb-1">
                Salary Range
              </p>
              <div className="flex items-center gap-2">
                <DollarSign size={18} />
                <span className="font-medium">{salaryText}</span>
              </div>
            </div>

            <div>
              <p className="text-[var(--color-text-muted)] text-sm mb-1">
                Posted
              </p>
              <span className="font-medium">
                {posted
                  ? new Date(posted).toLocaleDateString()
                  : 'Recently'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              About this role
            </h2>
            <p className="whitespace-pre-wrap leading-8 text-[var(--color-text)]">
              {description}
            </p>
          </div>

          {/* Requirements */}
          {requirementsList.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                Requirements
              </h2>
              <ul className="list-disc list-inside space-y-2 text-[var(--color-text)]">
                {requirementsList.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Info box */}
          <div className="bg-[var(--color-bg)] border border-[var(--color-card-border)] rounded-lg p-4 mb-8">
            <p className="text-[var(--color-text-muted)]">
              Share this opportunity with others or save it for later review.
            </p>
          </div>

          {/* AI Resume Match */}
          <div className="mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg-soft)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-teal-500" />
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                AI Resume Match
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Upload resume file (PDF/DOCX)
                </label>
                <div className="rounded-xl border border-dashed border-teal-500/35 bg-teal-500/5 p-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="input-field"
                  />
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Upload one resume file and keep it saved for this job until you remove it.
                  </p>
                </div>
                {(resumeFile || savedResumeFileName) && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card-bg)] px-3 py-2 text-sm text-[var(--color-text)]">
                    <span className="truncate pr-2">
                      Selected: {resumeFile?.name || savedResumeFileName}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSavedResume}
                      className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-400"
                    >
                      <XCircle size={16} />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Job description (optional if job link works)
                </label>
                <textarea
                  rows={4}
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  className="input-field"
                  placeholder="Paste JD text for better accuracy..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAnalyzeResumeFile}
                  disabled={isUploadingAnalysis}
                  className="btn-primary"
                >
                  {isUploadingAnalysis ? 'Analyzing file...' : 'Analyze Uploaded File'}
                </button>
              </div>
            </div>

            {analysis && (
              <div className="mt-5 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Match Score</p>
                    <p className="text-3xl font-bold text-[var(--color-text)]">
                      {analysis.matchScore}%
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      analysis.shortlisted
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {analysis.shortlisted ? 'Likely Shortlisted' : 'Needs Improvement'}
                  </div>
                </div>

                {analysis.summary && (
                  <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                    {analysis.summary}
                  </p>
                )}

                {analysis.criteria && (
                  <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                    Skill coverage: <strong>{analysis.criteria.coveragePercent}%</strong>
                    {analysis.criteria.requiredSkills?.length
                      ? ` (${analysis.criteria.matchedSkills?.length || 0}/${analysis.criteria.requiredSkills.length} required skills matched)`
                      : ''}
                  </p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-2 font-semibold text-[var(--color-text)]">
                      <CheckCircle2 size={16} className="text-teal-600" />
                      Strengths
                    </p>
                    <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                      {(analysis.strengths || []).map((item, idx) => (
                        <li key={`s-${idx}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-2 font-semibold text-[var(--color-text)]">
                      <AlertTriangle size={16} className="text-amber-600" />
                      Weak Points
                    </p>
                    <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                      {(analysis.weakPoints || []).map((item, idx) => (
                        <li key={`w-${idx}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 font-semibold text-[var(--color-text)]">Missing Skills</p>
                    <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                      {(analysis.missingSkills || []).map((item, idx) => (
                        <li key={`m-${idx}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2 font-semibold text-[var(--color-text)]">Improvements</p>
                    <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                      {(analysis.improvements || []).map((item, idx) => (
                        <li key={`i-${idx}`}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status + Delete */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-4">
            <div className="flex gap-3">
              <select
                value={nextStatus || currentStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="input-field"
              >
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Rejected">Rejected</option>
                <option value="Offer">Offer</option>
              </select>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={isUpdating || !nextStatus || nextStatus === currentStatus}
                className="rounded-xl border border-teal-600 bg-teal-600 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl border border-red-700 bg-red-700 px-4 py-2.5 font-semibold text-white transition hover:bg-red-800 hover:border-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Job'}
            </button>
          </div>

          {/* Apply */}
          <button
            onClick={handleApply}
            type="button"
            disabled={!jobData.jobLink || isApplying}
            className="btn-primary w-full"
          >
            {isApplying ? 'Opening...' : 'Apply Now'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
