'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../components/Navigation'
import SEOHead from '../../components/SEOHead'
import { getCurrentUser, logout } from '../../lib/auth'

export default function AdminDashboard() {
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminPhones, setAdminPhones] = useState([])
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      router.push('/admin/login')
      return
    }
    setLoading(false)
    loadData()
  }, [])

  const migrateImageFields = async () => {
    try {
      const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase.client')
      
      const productsSnap = await getDocs(collection(db, 'products'))
      let updated = 0
      
      for (const productDoc of productsSnap.docs) {
        const data = productDoc.data()
        if (data.image && !data.image_url) {
          await updateDoc(doc(db, 'products', productDoc.id), {
            image_url: data.image,
            updatedAt: new Date()
          })
          updated++
        }
      }
      
      alert(`Migrated ${updated} products to use image_url field`)
    } catch (error) {
      console.error('Migration error:', error)
      alert('Error during migration')
    }
  }

  const loadData = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase.client')
      
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      setVendors(vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      const productsSnap = await getDocs(collection(db, 'products'))
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      const ordersSnap = await getDocs(collection(db, 'orders'))
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <>
      <SEOHead 
        title="Admin Dashboard | FreshCuts"
        description="Manage FreshCuts marketplace"
        url="https://freshcuts.com/admin"
      />
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '32px', margin: '0' }}>Admin Dashboard</h1>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3>Total Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{orders.length}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3>Total Vendors</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{vendors.length}</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3>Total Products</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{products.length}</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button 
              onClick={migrateImageFields} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#6366f1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12px' 
              }}
            >
              Migrate Image Fields
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {[
              { name: 'Vendors', path: '/admin/vendors', icon: '🏪' },
              { name: 'Products', path: '/admin/products', icon: '📦' },
              { name: 'Categories', path: '/admin/categories', icon: '📂' },
              { name: 'Orders', path: '/admin/orders', icon: '📋' },
              { name: 'Reports', path: '/admin/reports', icon: '📊' },
              { name: 'Settings', path: '/admin/settings', icon: '⚙️' }
            ].map(item => (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}