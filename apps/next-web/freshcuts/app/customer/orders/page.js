'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (user) {
      setCurrentUser(user)
      loadOrders(user.id)
    } else {
      setLoading(false)
    }
  }, [])

  const loadOrders = async (customerId) => {
    try {
      console.log('Loading orders for customer ID:', customerId)
      const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const parentOrdersQuery = query(
        collection(db, 'parentOrders'),
        where('customerId', '==', customerId)
      )
      
      const parentOrdersSnap = await getDocs(parentOrdersQuery)
      let allOrders = []
      
      for (const parentDoc of parentOrdersSnap.docs) {
        const parentData = parentDoc.data()
        if (parentData.vendorOrders && parentData.vendorOrders.length > 0) {
          // Get vendor orders for this parent order
          const vendorOrderPromises = parentData.vendorOrders.map(orderId => 
            getDoc(doc(db, 'orders', orderId))
          )
          const vendorOrderDocs = await Promise.all(vendorOrderPromises)
          
          vendorOrderDocs.forEach(vendorDoc => {
            if (vendorDoc.exists()) {
              allOrders.push({ 
                id: vendorDoc.id, 
                ...vendorDoc.data(), 
                parentOrderId: parentDoc.id
              })
            }
          })
        }
      }
      
      console.log('Found orders:', allOrders)
      setOrders(allOrders)
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready_for_pickup: '📦',
      assigned_for_delivery: '🚚',
      out_for_delivery: '🛵',
      delivered: '✅',
      cancelled: '❌'
    }
    return icons[status] || '📋'
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  if (!currentUser) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Please login to view your orders</h2>
          <Link href="/customer/login" style={{ color: '#16a34a', textDecoration: 'none' }}>
            Login here
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <h1 style={{ color: '#f97316', fontSize: window.innerWidth <= 768 ? '28px' : '32px', marginBottom: '30px', textAlign: window.innerWidth <= 768 ? 'center' : 'left' }}>My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: window.innerWidth <= 768 ? '40px 20px' : '60px' }}>
            <h2 style={{ color: '#92400e', marginBottom: '20px' }}>No orders yet</h2>
            <Link href="/customer/marketplace" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-1" style={{ gap: window.innerWidth <= 768 ? '16px' : '20px' }}>
            {orders.map(order => (
              <div key={order.id} className="card" style={{
                padding: window.innerWidth <= 768 ? '20px' : '25px'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr auto', 
                  gap: window.innerWidth <= 768 ? '16px' : '20px', 
                  marginBottom: '20px' 
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: window.innerWidth <= 768 ? '18px' : '20px', color: '#7c2d12' }}>
                      Order #{order.id.slice(-8)}
                    </h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#92400e' }}>
                      Vendor: {order.vendorName}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#92400e' }}>
                      Placed on: {new Date(order.createdAt?.toDate()).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#f97316' }}>
                      Total: ₹{order.total}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: window.innerWidth <= 768 ? 'left' : 'right' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: getStatusColor(order.status),
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '10px'
                    }}>
                      <span>{getStatusIcon(order.status)}</span>
                      {order.status?.replace('_', ' ').toUpperCase()}
                    </div>
                    
                    <div style={{ marginTop: window.innerWidth <= 768 ? '8px' : '0' }}>
                      <Link
                        href={`/customer/orders/${order.id}`}
                        className="btn btn-secondary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          width: window.innerWidth <= 768 ? '100%' : 'auto'
                        }}
                      >
                        Track Order
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#374151' }}>Items:</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {item.name} × {item.quantity}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                {order.deliveryOption !== 'pickup' && (
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#374151' }}>Delivery Info:</h4>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Address: {order.deliveryAddress?.address}
                    </p>
                    {order.trackingId && (
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#16a34a', fontWeight: '500' }}>
                        Tracking ID: {order.trackingId}
                      </p>
                    )}
                    {order.deliveryPartnerType && (
                      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                        Delivery by: {order.deliveryPartnerType === 'vendor' ? 'Vendor' : 'Delivery Partner'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}