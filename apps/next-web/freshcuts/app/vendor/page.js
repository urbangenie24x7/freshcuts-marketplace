'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '../../components/Navigation'
import { orderService } from '../../lib/orderService'

export default function VendorDashboard() {
  const [currentVendor, setCurrentVendor] = useState(null)
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const vendor = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (vendor && vendor.role === 'vendor') {
      setCurrentVendor(vendor)
      loadDashboardData(vendor.id)
    } else {
      setLoading(false)
    }
  }, [])

  const loadDashboardData = async (vendorId) => {
    try {
      const orders = await orderService.getVendorOrders(vendorId)
      
      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready_for_pickup').length
      }
      
      setOrderStats(stats)
      setRecentOrders(orders.slice(0, 5))
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const handleVendorLogin = () => {
    const testVendor = {
      id: 'R2JrahdSzQ9vMqiDYQ1X',
      role: 'vendor',
      businessName: 'Village Chicken Manikonda',
      email: 'vendor@villagechicken.com'
    }
    localStorage.setItem('currentUser', JSON.stringify(testVendor))
    setCurrentVendor(testVendor)
    loadDashboardData(testVendor.id)
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '30px' }}>
          Vendor Dashboard
        </h1>
        
        {currentVendor ? (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ margin: '0 0 10px 0' }}>Welcome, {currentVendor.businessName || currentVendor.name}!</h2>
              <p style={{ color: '#6b7280' }}>Manage your products, orders, and business settings from here.</p>
            </div>
            
            {/* Order Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#16a34a' }}>{orderStats.total}</h3>
                <p style={{ margin: '0', color: '#6b7280' }}>Total Orders</p>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#f59e0b' }}>{orderStats.pending}</h3>
                <p style={{ margin: '0', color: '#6b7280' }}>Pending Orders</p>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#8b5cf6' }}>{orderStats.preparing}</h3>
                <p style={{ margin: '0', color: '#6b7280' }}>Preparing</p>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#10b981' }}>{orderStats.ready}</h3>
                <p style={{ margin: '0', color: '#6b7280' }}>Ready</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <Link href="/vendor/orders" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>📋 Orders</h3>
                  <p style={{ margin: '0', color: '#6b7280' }}>View and manage customer orders</p>
                </div>
              </Link>
              
              <Link href="/vendor/products" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>🥩 Products</h3>
                  <p style={{ margin: '0', color: '#6b7280' }}>Manage your product catalog</p>
                </div>
              </Link>
            </div>
            
            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0' }}>Recent Orders</h3>
                  <Link href="/vendor/orders" style={{ color: '#16a34a', textDecoration: 'none', fontSize: '14px' }}>View All →</Link>
                </div>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {recentOrders.map(order => (
                    <div key={order.id} style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>Order #{order.id.slice(-8)}</p>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>{order.customerName} • ₹{order.total}</p>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: order.status === 'pending' ? '#fef3c7' : order.status === 'preparing' ? '#e0e7ff' : '#d1fae5',
                        color: order.status === 'pending' ? '#92400e' : order.status === 'preparing' ? '#3730a3' : '#065f46',
                        borderRadius: '12px',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#16a34a', marginBottom: '20px' }}>Vendor Login Required</h2>
              <p style={{ color: '#6b7280', marginBottom: '30px' }}>Please login as a vendor to access the dashboard</p>
              <button
                onClick={handleVendorLogin}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Login as Village Chicken Manikonda (Demo)
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}