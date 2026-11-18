'use client'

import React, { useEffect, useRef, useState } from 'react'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSubmitting(false)
      cancelRef.current?.focus()
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !submitting) onClose()
      }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, submitting, onClose])

  if (!isOpen) return null

  async function handleConfirm() {
    try {
      setSubmitting(true)
      await onConfirm()
      onClose()
    } catch (err) {
      console.error('Confirmation action failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scaleUp"
        style={{
          background: '#FFFFFF',
          border: `1px solid ${danger ? '#FF6A00' : '#FFB800'}`,
        }}
      >
        {/* Top accent stripe */}
        <div
          className="h-1.5 w-full"
          style={{
            background: danger
              ? 'linear-gradient(90deg, #FF6A00, #E94B00)'
              : 'linear-gradient(90deg, #FFB800, #FF6A00)',
          }}
        />

        <div className="p-6 sm:p-7">
          {/* Icon + Title */}
          <div className="flex items-start gap-3.5 mb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: danger ? 'rgba(233, 75, 0, 0.12)' : 'rgba(255, 184, 0, 0.15)',
              }}
            >
              {danger ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E94B00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: danger ? '#E94B00' : '#FF6A00' }}
              >
                {danger ? 'Warning' : 'Confirmation'}
              </div>
              <h2
                id="confirm-modal-title"
                className="text-lg font-bold text-[#111111]"
              >
                {title}
              </h2>
            </div>
          </div>

          <p className="text-sm mb-6 text-black/75 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-2.5 justify-end">
            <button
              ref={cancelRef}
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border text-[#111111] hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgba(0,0,0,0.15)' }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 flex items-center justify-center gap-2"
              style={{
                background: danger
                  ? 'linear-gradient(135deg, #E94B00, #FF6A00)'
                  : 'linear-gradient(135deg, #FFB800, #FF6A00)',
              }}
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
        </div>
      </div>
    </div>
  )
}
