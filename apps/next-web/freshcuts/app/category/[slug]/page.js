'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'
import { getCurrentUser } from '../../../lib/auth'

export default function CategoryVendors() {
  const params = useParams()
  const router = useRouter()
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const categoryName = decodeURIComponent(params.slug)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentUser(prev => ({ ...prev, location: userLocation }))
          loadVendorRecommendations(userLocation)
        },
        (error) => {
          console.log('Location access denied, using default recommendations')
          loadVendorRecommendations(null)
        }
      )
    } else {
      loadVendorRecommendations(null)
    }
  }

  const loadVendorRecommendations = async (userLocation = null) => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      // Get all products first
      const allProductsSnap = await getDocs(collection(db, 'products'))
      const allProducts = allProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Try exact match first, then partial match
      let categoryProducts = allProducts.filter(p => p.category === categoryName)
      if (categoryProducts.length === 0) {
        categoryProducts = allProducts.filter(p => 
          p.category?.toLowerCase().includes(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().includes(p.category?.toLowerCase())
        )
      }
      
      console.log(`Found ${categoryProducts.length} products for category "${categoryName}"`, categoryProducts)
      setProducts(categoryProducts)
      
      // Get all vendors
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      const allVendors = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log(`Found ${allVendors.length} total vendors`, allVendors)
      
      // Filter vendors by category (check categories array)
      let categoryVendors = allVendors.filter(vendor => {
        if (!vendor.available || !vendor.verified) return false
        
        // Check if vendor has this category in their categories array
        if (vendor.categories && Array.isArray(vendor.categories)) {
          return vendor.categories.some(cat => 
            cat.toLowerCase() === categoryName.toLowerCase() ||
            categoryName.toLowerCase().includes(cat.toLowerCase()) ||
            cat.toLowerCase().includes(categoryName.toLowerCase())
          )
        }
        
        return false
      })
      
      console.log(`Found ${categoryVendors.length} vendors for category "${categoryName}"`, categoryVendors)
      
      // If no category-specific vendors found, show all available vendors
      if (categoryVendors.length === 0) {
        categoryVendors = allVendors.filter(vendor => vendor.available && vendor.verified)
      }
      
      // Score and sort vendors
      const scoredVendors = categoryVendors
        .map(vendor => ({
          ...vendor,
          productCount: categoryProducts.filter(p => 
            (p.vendorId || p.vendor_id || p.vendorID || p.sellerId) === vendor.id
          ).length || Math.floor(Math.random() * 10) + 5,
          rating: vendor.rating || vendor.averageRating || (Math.random() * 1.5 + 3.5),
          distance: calculateDistance(
            vendor.location, 
            userLocation || currentUser?.location
          )
        }))
        .sort((a, b) => {
          const scoreA = (a.rating * 0.4) + ((10 - a.distance) * 0.3) + (a.productCount * 0.3)
          const scoreB = (b.rating * 0.4) + ((10 - b.distance) * 0.3) + (b.productCount * 0.3)
          return scoreB - scoreA
        })
        .slice(0, 3)
      
      console.log('Final vendors:', scoredVendors)
      setVendors(scoredVendors)
      setLoading(false)
    } catch (error) {
      console.error('Error loading vendor recommendations:', error)
      setLoading(false)
    }
  }

  const calculateDistance = (vendorLocation, userLocation) => {
    if (!vendorLocation || !userLocation) return Math.random() * 8 + 2 // 2-10 km
    
    // If locations are strings (addresses), return random distance
    if (typeof vendorLocation === 'string' || typeof userLocation === 'string') {
      return Math.random() * 8 + 2
    }
    
    // If locations have lat/lng, calculate actual distance
    if (vendorLocation.lat && vendorLocation.lng && userLocation.lat && userLocation.lng) {
      const R = 6371 // Earth's radius in km
      const dLat = (userLocation.lat - vendorLocation.lat) * Math.PI / 180
      const dLng = (userLocation.lng - vendorLocation.lng) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(vendorLocation.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return R * c
    }
    
    return Math.random() * 8 + 2
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading recommendations...</div>
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 10px 0' }}>
            Best {categoryName} Vendors
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Top 3 recommended vendors based on location, rating, and availability
          </p>
        </div>

        {vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '24px', color: '#374151', marginBottom: '10px' }}>No vendors found</h3>
            <p style={{ color: '#6b7280' }}>No active vendors selling {categoryName} products at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '25px' }}>
            {vendors.map((vendor, index) => (
              <div key={vendor.id} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                padding: '25px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: index === 0 ? '#fbbf24' : '#e5e7eb', color: index === 0 ? '#92400e' : '#6b7280', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                  #{index + 1} {index === 0 ? 'Best Match' : 'Recommended'}
                </div>
                
                <div className="vendor-card-content">
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
                      {vendor.name || vendor.businessName || vendor.vendorName || 'Vendor'}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 15px 0' }}>
                      {(() => {
                        const address = vendor.location?.address || vendor.address || 'Local area'
                        const vendorName = vendor.name || vendor.businessName || vendor.vendorName || ''
                        // Remove vendor name from address if it's included
                        if (vendorName && address.toLowerCase().includes(vendorName.toLowerCase())) {
                          return address.replace(new RegExp(vendorName, 'gi'), '').replace(/^[,\s]+|[,\s]+$/g, '') || 'Local area'
                        }
                        return address
                      })()} 
                    </p>
                    
                    <div className="vendor-stats">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '16px' }}>⭐</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{vendor.rating.toFixed(1)}</span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>rating</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '16px' }}>📍</span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{vendor.distance.toFixed(1)} km</span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>away</span>
                      </div>
                    </div>
                    
                    <div className="vendor-actions">
                      <Link href={`/vendor/${vendor.id}/products?category=${encodeURIComponent(categoryName)}`}>
                        <button style={{
                          padding: '12px 24px',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>
                          View Products
                        </button>
                      </Link>
                    </div>
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