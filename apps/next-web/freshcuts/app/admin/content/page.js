'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminContent() {
  const [mounted, setMounted] = useState(false)
  const [bannerAds, setBannerAds] = useState([])

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const bannerSnap = await getDocs(collection(db, 'bannerAds'))
      setBannerAds(bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Content Management</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
          {bannerAds.map(banner => (
            <div key={banner.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3>{banner.title}</h3>
              <p>Active: {banner.active ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}