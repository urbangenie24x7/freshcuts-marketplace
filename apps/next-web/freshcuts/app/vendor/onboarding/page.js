'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function VendorOnboarding() {
  const [mounted, setMounted] = useState(false)
  const [onboardingData, setOnboardingData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    categories: []
  })

  useEffect(() => {
    const user = requireAuth(['vendor'])
    if (!user) return
    setMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { collection, addDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      await addDoc(collection(db, 'vendorApplications'), onboardingData)
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error submitting application')
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Vendor Onboarding</h1>
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Business Name:</label>
            <input
              type="text"
              value={onboardingData.businessName}
              onChange={(e) => setOnboardingData({...onboardingData, businessName: e.target.value})}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Owner Name:</label>
            <input
              type="text"
              value={onboardingData.ownerName}
              onChange={(e) => setOnboardingData({...onboardingData, ownerName: e.target.value})}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone:</label>
            <input
              type="tel"
              value={onboardingData.phone}
              onChange={(e) => setOnboardingData({...onboardingData, phone: e.target.value})}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Submit Application
          </button>
        </form>
      </div>
    </>
  )
}