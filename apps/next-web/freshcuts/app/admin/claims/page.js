'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminClaims() {
  const [mounted, setMounted] = useState(false)
  const [claims, setClaims] = useState([])

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadClaims()
  }, [])

  const loadClaims = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const claimsSnap = await getDocs(collection(db, 'claims'))
      setClaims(claimsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading claims:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Claims Management</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
          {claims.map(claim => (
            <div key={claim.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3>Claim #{claim.id.slice(-6)}</h3>
              <p>Status: {claim.status}</p>
              <p>Amount: ₹{claim.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}