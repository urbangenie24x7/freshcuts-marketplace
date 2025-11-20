'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/Navigation'
import { getCurrentUser } from '../../../lib/auth'

export default function VendorProfile() {
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    lat: '',
    lng: '',
    categories: [],
    available: true,
    verified: false,
    rating: 4.0,
    status: 'active'
  })
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'vendor') {
      router.push('/vendor/login')
      return
    }
    setCurrentUser(user)
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.location?.address || '',
      area: user.location?.area || '',
      lat: user.location?.lat || '',
      lng: user.location?.lng || '',
      categories: user.categories || [],
      available: user.available !== undefined ? user.available : true,
      verified: user.verified !== undefined ? user.verified : false,
      rating: user.rating || 4.0,
      status: user.status || 'active'
    })
    setMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      await updateDoc(doc(db, 'vendors', currentUser.id), {
        name: formData.name,
        phone: formData.phone,
        location: {
          address: formData.address,
          area: formData.area,
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0
        },
        available: formData.available,
        updatedAt: new Date()
      })
      
      // Update localStorage
      const updatedUser = {
        ...currentUser,
        name: formData.name,
        phone: formData.phone,
        location: {
          ...currentUser.location,
          address: formData.address,
          area: formData.area
        }
      }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile')
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
          <a href="/vendor" style={{ color: '#16a34a', textDecoration: 'none' }}>Vendor Dashboard</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Profile</span>
        </nav>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Vendor Profile</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Vendor Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                fontSize: '16px',
                minHeight: '80px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Area/Locality</label>
            <input
              type="text"
              value={formData.area}
              onChange={(e) => setFormData({...formData, area: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Latitude</label>
              <input
                type="number"
                value={formData.lat}
                onChange={(e) => setFormData({...formData, lat: e.target.value})}
                step="any"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Longitude</label>
              <input
                type="number"
                value={formData.lng}
                onChange={(e) => setFormData({...formData, lng: e.target.value})}
                step="any"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Categories</label>
            <div style={{ 
              padding: '10px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '4px',
              backgroundColor: '#f9fafb',
              fontSize: '16px'
            }}>
              {formData.categories.length > 0 ? formData.categories.join(', ') : 'No categories assigned'}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
              Categories are managed by admin. Contact support to update your categories.
            </p>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({...formData, available: e.target.checked})}
                style={{ transform: 'scale(1.2)' }}
              />
              Available for Orders
            </label>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
              Toggle your availability to receive new orders
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Verification Status</label>
              <div style={{ 
                padding: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                backgroundColor: '#f9fafb',
                fontSize: '16px',
                color: formData.verified ? '#16a34a' : '#dc2626'
              }}>
                {formData.verified ? '✓ Verified' : '✗ Not Verified'}
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
                Verification is managed by admin
              </p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Rating</label>
              <div style={{ 
                padding: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                backgroundColor: '#f9fafb',
                fontSize: '16px'
              }}>
                ⭐ {formData.rating}/5.0
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
                Rating is based on customer reviews
              </p>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Account Status</label>
            <div style={{ 
              padding: '10px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '4px',
              backgroundColor: '#f9fafb',
              fontSize: '16px',
              color: formData.status === 'active' ? '#16a34a' : formData.status === 'pending' ? '#f59e0b' : '#dc2626'
            }}>
              {formData.status === 'active' ? '✓ Active' : formData.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
              Account status is managed by admin
            </p>
          </div>
          
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Update Profile
          </button>
        </form>
      </div>
    </>
  )
}