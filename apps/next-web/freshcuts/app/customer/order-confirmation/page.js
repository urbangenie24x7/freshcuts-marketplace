'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'

function OrderConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orderIds = searchParams.get('orderIds')
    const parentOrderId = searchParams.get('parentOrderId')
    
    if (parentOrderId) {
      loadOrders(null, parentOrderId)
    } else if (orderIds) {
      loadOrders(orderIds.split(','))
    }
  }, [searchParams])

  const loadOrders = async (orderIdList, parentOrderId = null) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      let orderData = []
      
      if (parentOrderId) {
        const parentOrderDoc = await getDoc(doc(db, 'parentOrders', parentOrderId))
        if (parentOrderDoc.exists()) {
          const parentOrder = parentOrderDoc.data()
          const orderPromises = parentOrder.vendorOrders.map(id => getDoc(doc(db, 'orders', id)))
          const orderDocs = await Promise.all(orderPromises)
          
          orderData = orderDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate()
            }))
        }
      } else if (orderIdList) {
        const orderPromises = orderIdList.map(id => getDoc(doc(db, 'orders', id)))
        const orderDocs = await Promise.all(orderPromises)
        
        orderData = orderDocs
          .filter(doc => doc.exists())
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
      }
      
      setOrders(orderData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading orders:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  if (orders.length === 0) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h1 style={{ color: '#dc2626', fontSize: '24px', marginBottom: '10px' }}>Orders Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>The orders you're looking for could not be found.</p>
          <Link href="/customer/marketplace" style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#16a34a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Back to Shopping
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '10px' }}>Order Confirmed!</h1>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>
            Thank you for your order. We've sent confirmation details to your phone.
          </p>
        </div>

        {orders.map(order => (
          <div key={order.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', color: '#374151', margin: '0 0 5px 0' }}>
                  Order #{order.id.substring(0, 8)}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                  {order.vendorName} • {order.createdAt?.toLocaleString()}
                </p>
              </div>
              <div style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {order.status}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '10px' }}>Items Ordered:</h3>
              {order.items?.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
                <span>Total Paid:</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/customer/orders" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Track Orders
            </Link>
            <Link href="/customer/marketplace" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function OrderConfirmation() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  )
}