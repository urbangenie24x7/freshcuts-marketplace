'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { orderService } from '../../../lib/orderService'

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentVendor, setCurrentVendor] = useState(null)

  useEffect(() => {
    const vendor = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (vendor && vendor.role === 'vendor') {
      setCurrentVendor(vendor)
      loadVendorOrders(vendor.id)
    } else {
      setLoading(false)
    }
  }, [])

  const loadVendorOrders = async (vendorId) => {
    try {
      const vendorOrders = await orderService.getVendorOrders(vendorId)
      setOrders(vendorOrders)
      setLoading(false)
    } catch (error) {
      console.error('Error loading vendor orders:', error)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, message = null) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus, message)
      loadVendorOrders(currentVendor.id)
      alert('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order status')
    }
  }

  const handleSelfDelivery = async (orderId) => {
    try {
      await orderService.assignDeliveryPartner(
        orderId, 
        currentVendor.id, 
        'vendor', 
        currentVendor.businessName || currentVendor.name
      )
      loadVendorOrders(currentVendor.id)
      alert('Order assigned for self delivery')
    } catch (error) {
      console.error('Error assigning self delivery:', error)
      alert('Error assigning for delivery')
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

  if (!currentVendor) {
    return (
      <>
        <Navigation />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Please login as vendor to view orders</h2>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '30px' }}>
          My Orders - {currentVendor.businessName || currentVendor.name}
        </h1>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ color: '#6b7280' }}>No orders yet</h2>
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
                  {/* Order Info */}
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Order #{order.id.slice(-8)}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Customer: {order.customerName || order.customerEmail}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                      Phone: {order.customerPhone}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
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
                    {order.deliveryOption !== 'pickup' && order.deliveryAddress && (
                      <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280' }}>
                        Address: {order.deliveryAddress.address?.substring(0, 50)}...
                      </p>
                    )}
                    {order.trackingId && (
                      <p style={{ margin: '0', fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>
                        Tracking: {order.trackingId}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
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

                    {/* Status Update Buttons */}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed', 'Order confirmed by vendor')}
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
                        Confirm Order
                      </button>
                    )}

                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing', 'Order is being prepared')}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Start Preparing
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready_for_pickup', 'Order is ready')}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'ready_for_pickup' && order.deliveryOption !== 'pickup' && !order.deliveryPartnerId && (
                      <button
                        onClick={() => handleSelfDelivery(order.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#06b6d4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Self Delivery
                      </button>
                    )}

                    {order.status === 'assigned_for_delivery' && order.deliveryPartnerType === 'vendor' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery', 'Order out for delivery')}
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
                        Out for Delivery
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && order.deliveryPartnerType === 'vendor' && (
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
                    )}

                    {order.status === 'ready_for_pickup' && order.deliveryOption === 'pickup' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered', 'Order picked up by customer')}
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
                        Mark Picked Up
                      </button>
                    )}
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