'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../../components/Navigation'

export default function OrderTrackingPage() {
  const params = useParams()
  const [order, setOrder] = useState(null)
  const [trackingHistory, setTrackingHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.orderId) {
      loadOrderDetails(params.orderId)
    }
  }, [params.orderId])

  const loadOrderDetails = async (orderId) => {
    try {
      const { doc, getDoc, collection, query, where, orderBy, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../../lib/firebase.client')
      
      const orderDoc = await getDoc(doc(db, 'orders', orderId))
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() })
        
        const trackingQuery = query(
          collection(db, 'orderTracking'),
          where('orderId', '==', orderId),
          orderBy('timestamp', 'asc')
        )
        const trackingSnap = await getDocs(trackingQuery)
        setTrackingHistory(trackingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading order details:', error)
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: '📝' },
      { key: 'confirmed', label: 'Confirmed', icon: '✅' },
      { key: 'preparing', label: 'Preparing', icon: '👨🍳' }
    ]

    if (order?.deliveryOption === 'pickup') {
      steps.push({ key: 'ready_for_pickup', label: 'Ready for Pickup', icon: '📦' })
    } else {
      steps.push(
        { key: 'ready_for_pickup', label: 'Ready', icon: '📦' },
        { key: 'assigned_for_delivery', label: 'Assigned for Delivery', icon: '🚚' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' }
      )
    }
    
    steps.push({ key: 'delivered', label: 'Delivered', icon: '✅' })
    return steps
  }

  const getCurrentStepIndex = () => {
    const steps = getStatusSteps()
    return steps.findIndex(step => step.key === order?.status)
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>
  if (!order) return <div style={{ padding: '20px' }}>Order not found</div>

  const steps = getStatusSteps()
  const currentStepIndex = getCurrentStepIndex()

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/customer/orders" style={{ color: '#16a34a', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Orders
        </Link>

        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '28px', marginBottom: '20px' }}>
            Order #{order.id.slice(-8)}
          </h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151' }}>Order Details</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                <strong>Vendor:</strong> {order.vendorName}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                <strong>Total:</strong> ₹{order.total}
              </p>
              {order.trackingId && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#16a34a', fontWeight: '500' }}>
                  <strong>Tracking ID:</strong> {order.trackingId}
                </p>
              )}
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151' }}>
                {order.deliveryOption === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
              </h3>
              {order.deliveryOption === 'pickup' ? (
                <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                  <strong>Pickup from:</strong> Vendor Store
                </p>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                    <strong>Address:</strong> {order.deliveryAddress?.address}
                  </p>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                    <strong>Delivery by:</strong> {order.deliveryPartnerType === 'vendor' ? 'Vendor' : 'Delivery Partner'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151' }}>Items</h3>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{item.name} × {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 30px 0', fontSize: '24px', color: '#374151' }}>Order Tracking</h2>
          
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              backgroundColor: '#e5e7eb'
            }}>
              <div style={{
                width: '100%',
                height: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                backgroundColor: '#16a34a'
              }} />
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#16a34a' : '#e5e7eb',
                      color: isCompleted ? 'white' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      zIndex: 1
                    }}>
                      {step.icon}
                    </div>
                    
                    <div>
                      <h4 style={{
                        margin: '0 0 5px 0',
                        fontSize: '16px',
                        color: isCompleted ? '#374151' : '#9ca3af',
                        fontWeight: isCurrent ? '600' : '500'
                      }}>
                        {step.label}
                      </h4>
                      
                      {isCurrent && (
                        <p style={{ margin: '0', fontSize: '14px', color: '#16a34a', fontWeight: '500' }}>
                          Current Status
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {trackingHistory.length > 0 && (
            <div style={{ marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151' }}>Updates</h3>
              {trackingHistory.slice().reverse().map((update, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  marginBottom: '10px'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '500' }}>
                    {update.message || `Order ${update.status?.replace('_', ' ')}`}
                  </p>
                  <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                    {new Date(update.timestamp?.toDate()).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}