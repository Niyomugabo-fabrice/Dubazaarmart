'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const duration = toast.duration ?? 4500
    const newToast: ToastItem = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const success = useCallback((message: string, title = 'Success') => {
    showToast({ type: 'success', title, message })
  }, [showToast])

  const error = useCallback((message: string, title = 'Error') => {
    showToast({ type: 'error', title, message, duration: 6000 })
  }, [showToast])

  const warning = useCallback((message: string, title = 'Warning') => {
    showToast({ type: 'warning', title, message })
  }, [showToast])

  const info = useCallback((message: string, title = 'Notice') => {
    showToast({ type: 'info', title, message })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const config = {
    success: {
      border: '#17D719',
      bg: '#FFFFFF',
      iconBg: 'rgba(23, 215, 25, 0.15)',
      iconColor: '#0B5B24',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B5B24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    error: {
      border: '#FF6A00',
      bg: '#FFFFFF',
      iconBg: 'rgba(255, 106, 0, 0.15)',
      iconColor: '#FF6A00',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    warning: {
      border: '#FFB800',
      bg: '#FFFFFF',
      iconBg: 'rgba(255, 184, 0, 0.2)',
      iconColor: '#B37D00',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B37D00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    info: {
      border: '#0874F9',
      bg: '#FFFFFF',
      iconBg: 'rgba(8, 116, 249, 0.15)',
      iconColor: '#0874F9',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0874F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  }[toast.type]

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl transition-all duration-300 animate-slideIn"
      style={{
        background: config.bg,
        border: `2px solid ${config.border}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: config.iconBg }}
      >
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: config.iconColor }}>
            {toast.title}
          </h4>
        )}
        <p className="text-sm font-medium text-[#111111] leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onClose}
        type="button"
        aria-label="Close notification"
        className="w-6 h-6 rounded-full flex items-center justify-center text-black/50 hover:text-black hover:bg-black/5 transition-colors text-sm font-bold flex-shrink-0"
      >
        ×
      </button>
    </div>
  )
}
