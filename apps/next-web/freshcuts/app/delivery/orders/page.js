'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { orderService } from '../../../lib/orderService'

export default function DeliveryPartnerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPartner, setCurrentPartner] = useState(null)

  useEffect(() => {
    const partner = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (partner && partner.role === 'delivery_partner') {
      setCurrentPartner(partner)
      loadDeliveryOrders(partner.id)
    } else {
      setLoading(false)
    }
  }, [])

  const loadDeliveryOrders = async (partnerId) => {
    try {
      const partnerOrders = await orderService.getDeliveryPartnerOrders(partnerId)
      setOrders(partnerOrders)
      setLoading(false)
    } catch (error) {
      console.error('Error loading delivery orders:', error)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, message = null) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus, message, currentPartner.id)
      loadDeliveryOrders(currentPartner.id)
      alert('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      assigned_for_delivery: '#06b6d4',
      out_for_delivery: '#f97316',
      delivered: '#16a34a',
      failed_delivery: '#dc2626'
    }
    return colors[status] || '#6b7280'
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  if (!currentPartner) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Please login as delivery partner to view orders</h2>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '30px' }}>
          Delivery Orders - {currentPartner.name}
        </h1>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ color: '#6b7280' }}>No delivery orders assigned</h2>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {orders.map(order => (
              <div key={order.id} style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Order #{order.id.slice(-8)}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Vendor: {order.vendorName}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Customer: {order.customerName || order.customerEmail}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Phone: {order.customerPhone}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
                      Total: ₹{order.total}
                    </p>
                    {order.trackingId && (
                      <p style={{ margin: '0', fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>
                        Tracking: {order.trackingId}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Items:</h4>
                    {order.items?.map((item, idx) => (
                      <p key={idx} style={{ margin: '0 0 3px 0', fontSize: '13px', color: '#6b7280' }}>
                        {item.name} × {item.quantity}
                      </p>
                    ))}
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Delivery Address:</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                      {order.deliveryAddress?.address}
                    </p>
                    <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                      {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                    </p>
                    
                    <button
                      onClick={() => {
                        const address = encodeURIComponent(order.deliveryAddress?.address || '')
                        window.open(`https://maps.google.com/maps?q=${address}`, '_blank')
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      📍 Navigate
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: getStatusColor(order.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      textAlign: 'center',
                      textTransform: 'capitalize'
                    }}>
                      {order.status?.replace('_', ' ')}
                    </span>

                    {order.status === 'assigned_for_delivery' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery', 'Order picked up and out for delivery')}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f97316',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Start Delivery
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered', 'Order delivered successfully')}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Delivered
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'failed_delivery', 'Delivery failed - customer not available')}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Failed Delivery
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => window.open(`tel:${order.customerPhone}`, '_self')}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      📞 Call Customer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}