'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'
import { useCart } from '../../../lib/CartContext'

export default function CustomerDashboard() {
  const router = useRouter()
  const { cart, getCartTotal } = useCart()
  const [currentUser, setCurrentUser] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (!user) {
      router.push('/customer/marketplace')
      return
    }
    setCurrentUser(user)
    loadRecentOrders(user.id)
  }, [])

  const loadRecentOrders = async (userId) => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      )
      
      const ordersSnap = await getDocs(ordersQuery)
      const orders = ordersSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
        }))
        .slice(0, 5)
      
      setRecentOrders(orders)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  if (!currentUser) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '30px' }}>
        Welcome, {currentUser.name}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h3>Cart Items</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{cart.length}</p>
          <Link href="/customer/cart">View Cart</Link>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h3>Cart Total</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>₹{getCartTotal()}</p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h3>Total Orders</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{recentOrders.length}</p>
          <Link href="/customer/orders">View Orders</Link>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p>No orders yet. Start shopping!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {recentOrders.map(order => (
              <div key={order.id} style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <h4>Order #{order.id.slice(-6)}</h4>
                <p>Status: {order.status}</p>
                <p>Total: ₹{order.total}</p>
                <p>Date: {order.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  )
}