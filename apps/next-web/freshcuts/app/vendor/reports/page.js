'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function VendorReports() {
  const [mounted, setMounted] = useState(false)
  const [reports, setReports] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    const user = requireAuth(['vendor'])
    if (!user) return
    setMounted(true)
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const currentUser = JSON.parse(localStorage.getItem('currentUser'))
      
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('vendorId', '==', currentUser.id)))
      const productsSnap = await getDocs(query(collection(db, 'vendorProducts'), where('vendorId', '==', currentUser.id)))
      
      const orders = ordersSnap.docs.map(doc => doc.data())
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const pendingOrders = orders.filter(order => order.status === 'pending').length
      
      setReports({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsSnap.docs.length,
        pendingOrders
      })
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Vendor Reports</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3>Total Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{reports.totalOrders}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3>Total Revenue</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>₹{reports.totalRevenue}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3>Total Products</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{reports.totalProducts}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3>Pending Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{reports.pendingOrders}</p>
          </div>
        </div>
      </div>
    </>
  )
}