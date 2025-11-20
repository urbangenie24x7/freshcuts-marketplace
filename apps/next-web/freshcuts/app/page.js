'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to customer marketplace as the main landing page
    router.push('/customer/marketplace')
  }, [])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#16a34a' }}>FreshCuts</h1>
      <p>Redirecting to marketplace...</p>
    </div>
  )
}