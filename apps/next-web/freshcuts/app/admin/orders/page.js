'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/Navigation'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const ordersSnap = await getDocs(ordersQuery)
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    } catch (error) {
      console.error('Error loading orders:', error)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      loadOrders()
      alert('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order status')
    }
  }

  const assignDeliveryPartner = async (orderId, partnerId, partnerType) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryPartnerId: partnerId,
        deliveryPartnerType: partnerType, // 'vendor' or 'third_party'
        status: 'assigned_for_delivery',
        updatedAt: new Date()
      })
      
      loadOrders()
      alert('Delivery partner assigned successfully')
    } catch (error) {
      console.error('Error assigning delivery partner:', error)
      alert('Error assigning delivery partner')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

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
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '30px' }}>Order Management</h1>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned_for_delivery', 'out_for_delivery', 'delivered'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === status ? '#16a34a' : 'white',
                color: filter === status ? 'white' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {status.replace('_', ' ')} ({orders.filter(o => status === 'all' || o.status === status).length})
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredOrders.map(order => (
            <div key={order.id} style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'start' }}>
                {/* Order Info */}
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Order #{order.id.slice(-8)}</h3>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                    Customer: {order.customerName || order.customerEmail}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                    Vendor: {order.vendorName}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                    Total: ₹{order.total}
                  </p>
                  <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(order.createdAt?.toDate()).toLocaleString()}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Items:</h4>
                  {order.items?.map((item, idx) => (
                    <p key={idx} style={{ margin: '0 0 3px 0', fontSize: '13px', color: '#6b7280' }}>
                      {item.name} × {item.quantity}
                    </p>
                  ))}
                </div>

                {/* Delivery Info */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Delivery:</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280' }}>
                    Type: {order.deliveryOption || 'delivery'}
                  </p>
                  {order.deliveryPartnerType && (
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280' }}>
                      Partner: {order.deliveryPartnerType === 'vendor' ? 'Vendor' : 'Third Party'}
                    </p>
                  )}
                  {order.trackingId && (
                    <p style={{ margin: '0', fontSize: '13px', color: '#16a34a' }}>
                      Tracking: {order.trackingId}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(order.status),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    textAlign: 'center',
                    textTransform: 'capitalize'
                  }}>
                    {order.status?.replace('_', ' ')}
                  </span>

                  <select
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    style={{ padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                  >
                    <option value="">Update Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="assigned_for_delivery">Assign for Delivery</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {order.deliveryOption !== 'pickup' && !order.deliveryPartnerId && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button
                        onClick={() => assignDeliveryPartner(order.id, order.vendorId, 'vendor')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Assign to Vendor
                      </button>
                      <button
                        onClick={() => assignDeliveryPartner(order.id, 'third_party_001', 'third_party')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Assign to Delivery Partner
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            No orders found for the selected filter.
          </div>
        )}
      </div>
    </>
  )
}