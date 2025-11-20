'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function VendorPayments() {
  const [mounted, setMounted] = useState(false)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const user = requireAuth(['vendor'])
    if (!user) return
    setMounted(true)
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const currentUser = JSON.parse(localStorage.getItem('currentUser'))
      const paymentsSnap = await getDocs(query(collection(db, 'vendorPayments'), where('vendorId', '==', currentUser.id)))
      setPayments(paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading payments:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Payment History</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
          {payments.map(payment => (
            <div key={payment.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3>Payment #{payment.id.slice(-6)}</h3>
              <p>Amount: ₹{payment.amount}</p>
              <p>Status: {payment.status}</p>
              <p>Date: {payment.createdAt?.toDate?.()?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}