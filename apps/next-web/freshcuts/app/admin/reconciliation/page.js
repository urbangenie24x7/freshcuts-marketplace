'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminReconciliation() {
  const [mounted, setMounted] = useState(false)
  const [reconciliations, setReconciliations] = useState([])

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadReconciliations()
  }, [])

  const loadReconciliations = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const reconciliationSnap = await getDocs(collection(db, 'reconciliations'))
      setReconciliations(reconciliationSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading reconciliations:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Payment Reconciliation</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
          {reconciliations.map(recon => (
            <div key={recon.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3>Reconciliation #{recon.id.slice(-6)}</h3>
              <p>Amount: ₹{recon.amount}</p>
              <p>Status: {recon.status}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}