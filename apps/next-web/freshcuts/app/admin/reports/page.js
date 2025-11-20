'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminReports() {
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState('7')
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalVendors: 0,
    totalCustomers: 0,
    ordersByStatus: {},
    topProducts: []
  })

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const days = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), where('createdAt', '>=', startDate))
      )
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      const usersSnap = await getDocs(collection(db, 'users'))
      
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status || 'pending'] = (acc[order.status || 'pending'] || 0) + 1
        return acc
      }, {})
      
      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalVendors: vendorsSnap.docs.length,
        totalCustomers: usersSnap.docs.length,
        ordersByStatus,
        topProducts: []
      })
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const exportData = () => {
    const csvContent = `Date,Orders,Revenue,Vendors,Customers\n${new Date().toLocaleDateString()},${stats.totalOrders},${stats.totalRevenue},${stats.totalVendors},${stats.totalCustomers}`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `freshcuts-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>Reports & Analytics</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={exportData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#374151', fontSize: '16px', margin: '0 0 10px 0' }}>Total Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{stats.totalOrders}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>Last {dateRange} days</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#374151', fontSize: '16px', margin: '0 0 10px 0' }}>Total Revenue</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: '0' }}>₹{stats.totalRevenue.toLocaleString()}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>Last {dateRange} days</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#374151', fontSize: '16px', margin: '0 0 10px 0' }}>Active Vendors</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{stats.totalVendors}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>Total registered</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#374151', fontSize: '16px', margin: '0 0 10px 0' }}>Total Customers</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{stats.totalCustomers}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>Registered users</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#374151', fontSize: '18px', marginBottom: '15px' }}>Orders by Status</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize', color: '#6b7280' }}>{status}</span>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ color: '#374151', fontSize: '18px', marginBottom: '15px' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <button
                onClick={() => window.location.href = '/admin/orders'}
                style={{ padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
              >
                📋 Manage Orders
              </button>
              <button
                onClick={() => window.location.href = '/admin/vendors'}
                style={{ padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
              >
                🏪 Manage Vendors
              </button>
              <button
                onClick={() => window.location.href = '/admin/products'}
                style={{ padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
              >
                📦 Manage Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}