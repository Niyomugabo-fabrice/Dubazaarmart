'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPage from '@/views/AdminPage'
import { useAdminAuth } from '@/store/adminAuthStore'

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAdminAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check authentication on client
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/admin/login')
    } else {
      setChecking(false)
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#FFB800] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-black/60">Verifying administrator authorization...</p>
        </div>
      </div>
    )
  }

  return <AdminPage />
}
