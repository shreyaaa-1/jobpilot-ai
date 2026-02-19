import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { jobSchema } from '../utils/validation'
import { FormInput, FormTextarea } from '../components/FormInputs'
import {
  useCreateJob,
  useExtractJobFromLink,
  useLocationSuggestions,
} from '../api/queries'
import { useToast } from '../components/Toast'
import Layout from '../components/Layout'

export default function AddJobPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { mutate, isPending } = useCreateJob()
  const { mutate: extractFromLink, isPending: isExtracting } =
    useExtractJobFromLink()
  const [locationQuery, setLocationQuery] = useState('')
  const [extractMeta, setExtractMeta] = useState(null)
  const { data: locationSuggestions = [] } =
    useLocationSuggestions(locationQuery)

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      company: '',
      location: '',
      salary_min: '',
      salary_max: '',
      jobLink: '',
    },
  })

  const locationOptions = useMemo(
    () => Array.from(new Set(locationSuggestions)).slice(0, 10),
    [locationSuggestions]
  )

  const handleAutoFillFromLink = () => {
    const link = getValues('jobLink')
    if (!link) {
      toast.info('Please add a job link first')
      return
    }

    extractFromLink(link, {
      onSuccess: (response) => {
        const data = response?.data || {}
        setExtractMeta(data)

        if (data.role) setValue('title', data.role, { shouldValidate: true })
        if (data.companyName) {
          setValue('company', data.companyName, { shouldValidate: true })
        }
        if (data.location) {
          setValue('location', data.location, { shouldValidate: true })
          setLocationQuery(data.location)
        }

        if (data.description) {
          setValue(
            'description',
            `${data.description}`.trim(),
            { shouldValidate: true }
          )
        }

        if (data.needsReview) {
          toast.info('Auto-fill done with low confidence. Please review fields.')
        } else {
          toast.success('Job details auto-filled from link')
        }
      },
      onError: (err) => {
        setExtractMeta(null)
        toast.error(
          err?.response?.data?.message || 'Could not extract details from link'
        )
      },
    })
  }

  const onSubmit = (data) => {
    const payload = {
      companyName: data.company,
      role: data.title,
      notes: data.description || '',
      requiredSkills: Array.isArray(extractMeta?.requiredSkills)
        ? extractMeta.requiredSkills
        : [],
      location: data.location || '',
      salary_min: Number.isFinite(data.salary_min)
        ? data.salary_min
        : null,
      salary_max: Number.isFinite(data.salary_max)
        ? data.salary_max
        : null,
      jobLink: data.jobLink || '',
      appliedDate: new Date(),
    }

    mutate(payload, {
      onSuccess: (response) => {
        toast.success('Job saved')
        const id = response?.data?._id
        if (id) {
          navigate(`/jobs/${id}`)
        } else {
          navigate('/jobs')
        }
      },
      onError: (err) => {
        toast.error(
          err.response?.data?.message || 'Failed to add job'
        )
      },
    })
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h1 className="mb-4 text-2xl font-bold text-[var(--color-text)]">
            Add Job
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {extractMeta?.source && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  extractMeta?.needsReview
                    ? 'border-[var(--color-card-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                    : 'border-[var(--color-card-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                }`}
              >
                Extract source: {extractMeta.source} | Confidence: {extractMeta.confidence || 0}%
                {extractMeta?.needsReview
                  ? ' | Please review title/company/location before saving.'
                  : ' | Extraction looks good.'}
              </div>
            )}

            <FormInput
              label="Job title"
              {...register('title')}
              error={errors.title}
            />

            <FormInput
              label="Company"
              {...register('company')}
              error={errors.company}
            />

            <FormInput
              label="Location"
              placeholder="City, State (e.g., Austin, TX)"
              list="location-suggestions"
              {...register('location', {
                onChange: (e) => setLocationQuery(e.target.value),
              })}
              error={errors.location}
            />
            <datalist id="location-suggestions">
              {locationOptions.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>

            <div>
              <FormInput
                label="Job Link"
                placeholder="https://company.com/careers/123"
                {...register('jobLink')}
                error={errors.jobLink}
              />
              <button
                type="button"
                onClick={handleAutoFillFromLink}
                disabled={isExtracting}
                className="btn-secondary mt-2 inline-flex items-center gap-2"
              >
                <Sparkles size={16} />
                {isExtracting
                  ? 'Extracting...'
                  : 'Auto-fill Title, Location, Description'}
              </button>
            </div>

            <FormInput
              label="Min salary (optional)"
              type="number"
              {...register('salary_min', { valueAsNumber: true })}
              error={errors.salary_min}
            />

            <FormInput
              label="Max salary (optional)"
              type="number"
              {...register('salary_max', { valueAsNumber: true })}
              error={errors.salary_max}
            />

            <FormTextarea
              label="Job Description / Skills / Requirements"
              placeholder="Paste or review JD, required skills, and requirements..."
              rows={6}
              {...register('description')}
              error={errors.description}
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
              >
                {isPending ? 'Saving...' : 'Save Job'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
