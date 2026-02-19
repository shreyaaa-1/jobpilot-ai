import toast, { Toaster } from 'react-hot-toast'
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'

/* ================= PROVIDER ================= */

export const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className:
            'bg-gray-900 text-white dark:bg-gray-800 rounded-lg shadow-lg max-w-xs',
        }}
      />
    </>
  )
}

/* ================= HOOK ================= */

export const useToast = () => {
  return {
    success: (message) =>
      toast.success(message, {
        icon: <CheckCircle size={20} />,
      }),

    error: (message) =>
      toast.error(message, {
        icon: <AlertCircle size={20} />,
      }),

    loading: (message) => {
      const id = toast.loading(message)
      return id // 🔥 allows manual dismiss later
    },

    info: (message) =>
      toast.custom(() => (
        <div className="flex items-center gap-2 bg-gray-900 text-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg max-w-xs">
          <Info size={20} />
          <span>{message}</span>
        </div>
      )),

    warning: (message) =>
      toast.custom(() => (
        <div className="flex items-center gap-2 bg-gray-900 text-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg max-w-xs">
          <AlertTriangle size={20} />
          <span>{message}</span>
        </div>
      )),
  }
}
