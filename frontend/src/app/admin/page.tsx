'use client'

import AdminPage from '@/views/AdminPage'

export default function AdminRoute() {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <AdminPage setPage={(p) => {
        if (p === 'home') {
          window.location.href = '/'
        } else {
          window.location.href = `/#${p}`
        }
      }} />
    </div>
  )
}
