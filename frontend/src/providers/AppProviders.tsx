'use client'

import React, { ReactNode } from 'react'
import { ToastProvider } from '../components/ui/Toast'
import { DialogProvider } from '../components/ui/DialogContext'

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DialogProvider>
        {children}
      </DialogProvider>
    </ToastProvider>
  )
}
