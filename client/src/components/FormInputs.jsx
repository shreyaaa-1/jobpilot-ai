import { forwardRef, useState } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

/* ================= FORM INPUT ================= */

export const FormInput = forwardRef(
  ({ label, error, type = 'text', placeholder, id, ...props }, ref) => {
    const [show, setShow] = useState(false)
    const isPassword = type === 'password'

    // 🔥 accessible id generation
    const inputId =
      id || label?.toLowerCase().replace(/\s+/g, '-') || undefined

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium auth-label text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={isPassword ? (show ? 'text' : 'password') : type}
            placeholder={placeholder}
            className={`input-field pr-10 disabled:opacity-60 disabled:cursor-not-allowed ${
              error ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
            <AlertCircle size={16} />
            {error.message}
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

/* ================= TEXTAREA ================= */

export const FormTextarea = forwardRef(
  ({ label, error, placeholder, rows = 4, id, ...props }, ref) => {
    const inputId =
      id || label?.toLowerCase().replace(/\s+/g, '-') || undefined

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium auth-label text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}

        <textarea
          id={inputId}
          ref={ref}
          placeholder={placeholder}
          rows={rows}
          className={`input-field disabled:opacity-60 disabled:cursor-not-allowed ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          {...props}
        />

        {error && (
          <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
            <AlertCircle size={16} />
            {error.message}
          </div>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

/* ================= SELECT ================= */

export const FormSelect = forwardRef(
  ({ label, error, options, placeholder, id, ...props }, ref) => {
    const inputId =
      id || label?.toLowerCase().replace(/\s+/g, '-') || undefined

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium auth-label text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}

        <select
          id={inputId}
          ref={ref}
          className={`input-field disabled:opacity-60 disabled:cursor-not-allowed ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
            <AlertCircle size={16} />
            {error.message}
          </div>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'
