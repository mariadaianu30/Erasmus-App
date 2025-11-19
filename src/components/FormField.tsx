'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  name: string
  type?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  placeholder?: string
  className?: string
  rows?: number
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  className = '',
  rows,
  options,
  min,
  max,
  step,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const showError = touched && error
  const showSuccess = touched && !error && value

  useEffect(() => {
    if (touched && value) {
      setIsValidating(true)
      const timer = setTimeout(() => setIsValidating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [value, touched])

  const handleBlur = () => {
    setTouched(true)
    onBlur?.()
  }

  const inputId = `field-${name}`
  const errorId = `error-${name}`
  const describedBy = [ariaDescribedBy, showError ? errorId : null].filter(Boolean).join(' ') || undefined

  const baseInputClasses = `
    w-full px-4 py-2 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${showError ? 'border-red-300 focus:ring-red-500' : ''}
    ${showSuccess ? 'border-green-300 focus:ring-green-500' : ''}
    ${!showError && !showSuccess ? 'border-gray-300' : ''}
    ${className}
  `.trim()

  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          rows={rows || 4}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-describedby={describedBy}
          aria-invalid={showError}
          aria-required={required}
          className={baseInputClasses}
        />
      ) : type === 'select' && options ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-describedby={describedBy}
          aria-invalid={showError}
          aria-required={required}
          className={baseInputClasses}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-describedby={describedBy}
          aria-invalid={showError}
          aria-required={required}
          className={baseInputClasses}
        />
      )}

      {showError && (
        <div 
          id={errorId}
          className="flex items-center gap-2 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showSuccess && !isValidating && (
        <div 
          className="flex items-center gap-2 text-sm text-green-600"
          aria-live="polite"
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Looks good!</span>
        </div>
      )}
    </div>
  )
}

