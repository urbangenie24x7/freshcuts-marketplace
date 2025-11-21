'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'
import { useCart } from '../../../lib/CartContext'

export default function CustomerMarketplace() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const productsSnap = await getDocs(collection(db, 'products'))
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      const categoriesSnap = await getDocs(collection(db, 'categoryCards'))
      setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && product.available
  })

  const handleAddToCart = (product, variant = null) => {
    const cartItem = {
      id: variant ? `${product.id}-${variant.id}` : product.id,
      productId: product.id,
      name: variant ? `${product.name} - ${variant.name}` : product.name,
      price: variant ? product.default_price * variant.priceMultiplier : product.default_price,
      image: product.image_url,
      variant: variant,
      quantity: 1,
      vendorId: product.vendorId || 'default-vendor',
      vendorName: product.vendorName || 'FreshCuts'
    }
    addToCart(cartItem)
    alert('Added to cart!')
  }

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <>
      <Navigation />
      
      {/* Hero Section */}
      <div style={{
        backgroundColor: '#fef7ed',
        color: '#7c2d12',
        padding: '60px 20px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 20px 0', color: '#f97316' }}>FreshCuts</h1>
          <p style={{ fontSize: '24px', margin: '0 0 30px 0', color: '#fb923c', fontWeight: '500' }}>Premium Fresh Meat Delivered to Your Doorstep</p>
          <p style={{ fontSize: '18px', margin: '0 0 40px 0', color: '#fdba74' }}>🥩 Fresh • 🚚 Fast Delivery • Multi-Vendor • 💯 Quality Guaranteed</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '15px 25px', borderRadius: '25px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#f97316' }}>🕐 Same Day Delivery</span>
            </div>
            <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '15px 25px', borderRadius: '25px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#f97316' }}>❄️ Fresh & Hygienic</span>
            </div>
            <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '15px 25px', borderRadius: '25px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#f97316' }}>Multiple Vendors</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Category Cards Section */}
        {categories.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {categories.filter(cat => cat.active).map(category => (
                <Link key={category.id} href={`/category/${encodeURIComponent(category.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '25px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  {category.image ? (
                    <img src={category.image} alt={category.name} style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '16px', marginBottom: '25px', display: 'block', margin: '0 auto 25px auto' }} />
                  ) : (
                    <div style={{ width: '180px', height: '180px', backgroundColor: '#16a34a', borderRadius: '16px', margin: '0 auto 25px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
                      {category.icon || '🥩'}
                    </div>
                  )}
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>{category.name}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>{category.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top 10 Popular Products Section */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 30px 0', color: '#1f2937', textAlign: 'center' }}>🔥 Popular Products</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            {products.filter(product => product.available).slice(0, 10).map(product => (
              <Link key={product.id} href={`/category/${encodeURIComponent(product.category)}?product=${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ position: 'relative' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '150px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '36px' }}>
                        🥩
                      </div>
                    )}
                    {product.featured && (
                      <span style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fbbf24', color: '#92400e', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        ⭐ Featured
                      </span>
                    )}
                    {product.vendorName && (
                      <span style={{ position: 'absolute', bottom: '15px', left: '15px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#374151', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                        {product.vendorName}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937', lineHeight: '1.3' }}>{product.name}</h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '500', letterSpacing: '0.5px' }}>{product.category}</p>
                    {product.description && (
                      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                        {product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>


      </div>
    </>
  )
}