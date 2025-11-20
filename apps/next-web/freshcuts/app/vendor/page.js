'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../components/Navigation'
import SEOHead from '../../components/SEOHead'
import { getCurrentUser, logout } from '../../lib/auth'
import Link from 'next/link'

export default function VendorDashboard() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'vendor') {
      router.push('/vendor/login')
      return
    }
    setCurrentUser(user)
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase.client')
      
      const ordersSnap = await getDocs(collection(db, 'orders'))
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      const productsSnap = await getDocs(collection(db, 'vendorProducts'))
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading vendor data:', error)
      // Fallback to mock data
      setOrders([{ id: '1', status: 'pending' }, { id: '2', status: 'completed' }])
      setProducts([{ id: '1', name: 'Test Product' }])
    }
  }



  return (
    <>
      <SEOHead 
        title="Vendor Dashboard | FreshCuts"
        description="Manage your FreshCuts vendor account. View orders, manage products, and track sales."
        url="https://freshcuts.com/vendor"
      />
      <Navigation />
      <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#16a34a', fontSize: '32px', margin: '0' }}>Vendor Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>
              Welcome, {currentUser?.name}
            </p>
          </div>
          <button
            onClick={() => {
              logout()
              router.push('/vendor/login')
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#374151', fontSize: '16px', margin: '0 0 10px 0' }}>Total Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{orders.length}</p>
          </div>
          
          <div 
            onClick={() => router.push('/vendor/products')}
            style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #e5e7eb', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <h3 style={{ color: '#374151', fontSize: '16px', margin: '0 0 10px 0' }}>My Products</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{products.length}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>Click to manage pricing</p>
          </div>
        </div>
      </div>
    </>
  )
}