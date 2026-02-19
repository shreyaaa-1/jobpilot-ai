import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <AlertCircle size={64} className="mx-auto mb-4 text-gray-400" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Page not found
        </p>
        <Link to="/" className="btn-primary">
          Go back home
        </Link>
      </div>
    </div>
  )
}
