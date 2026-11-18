'use client'

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react'
import ConfirmModal from '../ConfirmModal'
import PromptModal from './PromptModal'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export interface PromptOptions {
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  inputType?: 'text' | 'number' | 'email' | 'password' | 'textarea'
  confirmLabel?: string
  cancelLabel?: string
  required?: boolean
  validate?: (val: string) => string | null | undefined
}

export interface AlertOptions {
  title?: string
  message: string
  confirmLabel?: string
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
  alert: (options: AlertOptions | string) => Promise<void>
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  // Confirm state
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)
  const confirmResolveRef = useRef<((val: boolean) => void) | null>(null)

  // Prompt state
  const [promptState, setPromptState] = useState<PromptOptions | null>(null)
  const promptResolveRef = useRef<((val: string | null) => void) | null>(null)

  // Alert state
  const [alertState, setAlertState] = useState<AlertOptions | null>(null)
  const alertResolveRef = useRef<(() => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setConfirmState(options)
    })
  }, [])

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      promptResolveRef.current = resolve
      setPromptState(options)
    })
  }, [])

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      alertResolveRef.current = resolve
      if (typeof options === 'string') {
        setAlertState({ title: 'Notice', message: options })
      } else {
        setAlertState(options)
      }
    })
  }, [])

  const handleConfirmClose = () => {
    confirmResolveRef.current?.(false)
    confirmResolveRef.current = null
    setConfirmState(null)
  }

  const handleConfirmAccept = () => {
    confirmResolveRef.current?.(true)
    confirmResolveRef.current = null
    setConfirmState(null)
  }

  const handlePromptClose = () => {
    promptResolveRef.current?.(null)
    promptResolveRef.current = null
    setPromptState(null)
  }

  const handlePromptSubmit = (value: string) => {
    promptResolveRef.current?.(value)
    promptResolveRef.current = null
    setPromptState(null)
  }

  const handleAlertClose = () => {
    alertResolveRef.current?.()
    alertResolveRef.current = null
    setAlertState(null)
  }

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}

      {/* Confirmation Modal */}
      {confirmState && (
        <ConfirmModal
          isOpen={true}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          danger={confirmState.danger}
          onConfirm={handleConfirmAccept}
          onClose={handleConfirmClose}
        />
      )}

      {/* Input / Prompt Modal */}
      {promptState && (
        <PromptModal
          isOpen={true}
          title={promptState.title}
          message={promptState.message}
          placeholder={promptState.placeholder}
          defaultValue={promptState.defaultValue}
          inputType={promptState.inputType}
          confirmLabel={promptState.confirmLabel}
          cancelLabel={promptState.cancelLabel}
          required={promptState.required}
          validate={promptState.validate}
          onConfirm={handlePromptSubmit}
          onClose={handlePromptClose}
        />
      )}

      {/* Alert Notification Modal */}
      {alertState && (
        <ConfirmModal
          isOpen={true}
          title={alertState.title || 'Notice'}
          message={alertState.message}
          confirmLabel={alertState.confirmLabel || 'OK'}
          cancelLabel=""
          danger={false}
          onConfirm={handleAlertClose}
          onClose={handleAlertClose}
        />
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
