import { InboxIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No data found',
  description = 'There is nothing to display here',
  action = null,
}) => {
  const navigate = useNavigate()

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="mb-4 rounded-full bg-emerald-500/15 p-4 motion-safe:animate-pulse">
        <Icon size={36} className="text-emerald-400" />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mb-6 max-w-sm text-slate-600">
        {description}
      </p>

      {action ? (
        <div>{action}</div>
      ) : (
        <button
          onClick={() => navigate('/jobs/new')}
          className="btn-primary"
        >
          Add Job
        </button>
      )}
    </div>
  )
}
