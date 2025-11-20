'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'
import GooglePlacesAutocomplete from '../../../components/GooglePlacesAutocomplete'
import GoogleMapLocationPicker from '../../../components/GoogleMapLocationPicker'

export default function CustomerProfile() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    lat: null,
    lng: null
  })
  const [showMapPicker, setShowMapPicker] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (!user) {
      router.push('/customer/marketplace')
      return
    }
    setCurrentUser(user)
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      lat: user.lat || null,
      lng: user.lng || null
    })
    loadOrders(user.id)
  }, [])

  const loadOrders = async (customerId) => {
    try {
      console.log('Profile: Loading orders for customer ID:', customerId)
      const { collection, getDocs, query, where, limit, doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const parentOrdersQuery = query(
        collection(db, 'parentOrders'),
        where('customerId', '==', customerId),
        limit(3)
      )
      
      const parentOrdersSnap = await getDocs(parentOrdersQuery)
      let recentOrders = []
      
      for (const parentDoc of parentOrdersSnap.docs) {
        const parentData = parentDoc.data()
        if (parentData.vendorOrders && parentData.vendorOrders.length > 0) {
          // Get first vendor order for display
          const firstVendorOrderDoc = await getDoc(doc(db, 'orders', parentData.vendorOrders[0]))
          if (firstVendorOrderDoc.exists()) {
            recentOrders.push({ 
              id: firstVendorOrderDoc.id, 
              ...firstVendorOrderDoc.data(), 
              parentOrderId: parentDoc.id,
              totalAmount: parentData.totalAmount,
              totalVendors: parentData.vendorOrders.length
            })
          }
        }
      }
      
      console.log('Profile: Found orders:', recentOrders)
      setOrders(recentOrders)
      setLoadingOrders(false)
    } catch (error) {
      console.error('Profile: Error loading orders:', error)
      setLoadingOrders(false)
    }
  }

  const saveProfile = async () => {
    try {
      const updatedUser = { ...currentUser, ...profileData }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setEditingProfile(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
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

  if (!currentUser) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '800px' }}>
        <h1 style={{ color: '#f97316', fontSize: window.innerWidth <= 768 ? '28px' : '32px', marginBottom: '30px', textAlign: window.innerWidth <= 768 ? 'center' : 'left' }}>
          Manage Profile
        </h1>

        <div className="card" style={{ padding: window.innerWidth <= 768 ? '20px' : '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center', 
            marginBottom: '25px',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            gap: window.innerWidth <= 768 ? '16px' : '0'
          }}>
            <h2 style={{ color: '#7c2d12', margin: 0 }}>Personal Information</h2>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className={editingProfile ? 'btn' : 'btn btn-primary'}
              style={{
                backgroundColor: editingProfile ? '#ef4444' : undefined,
                width: window.innerWidth <= 768 ? '100%' : 'auto'
              }}
            >
              {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name:</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email:</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone:</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <GooglePlacesAutocomplete
                    placeholder="Enter your address"
                    value={profileData.address}
                    onPlaceSelect={(place) => {
                      setProfileData({
                        ...profileData,
                        address: place.formatted_address,
                        lat: place.lat,
                        lng: place.lng
                      })
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📍 Map
                  </button>
                </div>
              </div>
              <button
                onClick={saveProfile}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Name:</span>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{currentUser.name}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Email:</span>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{currentUser.email || 'Not provided'}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Phone:</span>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{currentUser.phone}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Address:</span>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{currentUser.address || 'Not provided'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card" style={{ padding: window.innerWidth <= 768 ? '20px' : '30px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2>Recent Orders</h2>
            <Link
              href="/customer/orders"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              View All
            </Link>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <p style={{ marginBottom: '15px' }}>No orders yet</p>
              <Link
                href="/customer/marketplace"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px'
                }}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {orders.map(order => (
                <div key={order.id} style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '15px', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937' }}>
                        Order #{order.id.slice(-8)}
                      </h3>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
                        {order.vendorName} • {new Date(order.createdAt?.toDate()).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
                        ₹{order.total}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {order.status?.replace('_', ' ').toUpperCase()}
                      </div>
                      <Link
                        href={`/customer/orders/${order.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        Track
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {showMapPicker && (
          <GoogleMapLocationPicker
            onLocationSelect={(location) => {
              setProfileData({
                ...profileData,
                address: location.address,
                lat: location.lat,
                lng: location.lng
              })
            }}
            onClose={() => setShowMapPicker(false)}
            addressDetails={{
              flatNo: '',
              buildingName: '',
              streetName: '',
              locality: '',
              city: '',
              pincode: ''
            }}
          />
        )}
      </div>
    </>
  )
}