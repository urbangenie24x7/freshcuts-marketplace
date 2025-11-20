'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminPincodes() {
  const [mounted, setMounted] = useState(false)
  const [pincodes, setPincodes] = useState([])

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadPincodes()
  }, [])

  const loadPincodes = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const pincodesSnap = await getDocs(collection(db, 'pincodes'))
      setPincodes(pincodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading pincodes:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Pincode Management</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {pincodes.map(pincode => (
            <div key={pincode.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3>{pincode.code}</h3>
              <p>{pincode.area}</p>
              <p>Active: {pincode.active ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}