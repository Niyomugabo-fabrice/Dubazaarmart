'use client'

import React, { useState, useEffect, useRef } from 'react'

export interface PromptModalProps {
  isOpen: boolean
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  inputType?: 'text' | 'number' | 'email' | 'password' | 'textarea'
  confirmLabel?: string
  cancelLabel?: string
  required?: boolean
  validate?: (val: string) => string | null | undefined
  onConfirm: (value: string) => Promise<void> | void
  onClose: () => void
}

export default function PromptModal({
  isOpen,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  inputType = 'text',
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  required = true,
  validate,
  onConfirm,
  onClose,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setError(null)
      setSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, defaultValue])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, submitting, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (required && !value.trim()) {
      setError('This field is required.')
      return
    }

    if (validate) {
      const customErr = validate(value)
      if (customErr) {
        setError(customErr)
        return
      }
    }

    try {
      setSubmitting(true)
      await onConfirm(value.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fadeIn sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
    >
      <div
        className="max-h-[calc(100dvh_-_2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl p-6 shadow-2xl animate-scaleUp sm:p-7"
        style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}
      >
        <div className="flex items-center justify-between pb-3.5 border-b" style={{ borderColor: '#F1FFF0' }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF6A00]">Input Required</div>
            <h3 id="prompt-modal-title" className="text-xl font-bold text-[#111111] mt-0.5">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-black/50 hover:text-black hover:bg-black/5 text-lg font-bold"
          >
            ×
          </button>
        </div>

        {message && (
          <p className="text-sm mt-3 text-black/75 leading-relaxed">
            {message}
          </p>
        )}

        {error && (
          <div
            className="mt-3.5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: 'rgba(233, 75, 0, 0.08)', color: '#E94B00', border: '1px solid rgba(233, 75, 0, 0.25)' }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            {inputType === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all resize-none outline-none focus:ring-2 focus:ring-[#FFB800]"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={inputType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-[#FFB800]"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            )}
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border text-[#111111] hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgba(0,0,0,0.15)' }}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold btn-gold transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
