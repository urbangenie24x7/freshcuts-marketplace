'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/Navigation'
import { getCurrentUser, logout } from '../../../lib/auth'

export default function AdminProfilePage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      router.push('/admin/login')
      return
    }
    setCurrentUser(user)
    loadAllOrders()
  }, [])

  const loadAllOrders = async () => {
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      )
      const ordersSnap = await getDocs(ordersQuery)
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    } catch (error) {
      console.error('Error loading orders:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      preparing: '#8b5cf6',
      ready_for_pickup: '#10b981',
      assigned_for_delivery: '#06b6d4',
      out_for_delivery: '#f97316',
      delivered: '#16a34a',
      cancelled: '#dc2626'
    }
    return colors[status] || '#6b7280'
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '32px', margin: '0' }}>Admin Profile</h1>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        {/* Profile Info */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Profile Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Name
              </label>
              <p style={{ margin: '0', padding: '8px 0', fontSize: '16px', color: '#1f2937' }}>
                {currentUser?.name || 'Admin User'}
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Phone
              </label>
              <p style={{ margin: '0', padding: '8px 0', fontSize: '16px', color: '#1f2937' }}>
                {currentUser?.phone || 'Not provided'}
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Role
              </label>
              <p style={{ margin: '0', padding: '8px 0', fontSize: '16px', color: '#16a34a', fontWeight: '500' }}>
                {currentUser?.role?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>All Orders ({orders.length})</h2>
          
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <p>No orders found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {orders.map(order => (
                <div key={order.id} style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1f2937' }}>
                        Order #{order.id.slice(-8)}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px', color: '#6b7280' }}>
                        <p style={{ margin: '0' }}>Customer: {order.customerName}</p>
                        <p style={{ margin: '0' }}>Vendor: {order.vendorName}</p>
                        <p style={{ margin: '0' }}>Date: {new Date(order.createdAt?.toDate()).toLocaleDateString()}</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#16a34a' }}>Total: ₹{order.total}</p>
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: getStatusColor(order.status),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      {order.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Items:</h4>
                    <div style={{ display: 'grid', gap: '5px' }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                          <span>{item.name} × {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}