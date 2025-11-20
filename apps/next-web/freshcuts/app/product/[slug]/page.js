'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'
import { useCart } from '../../../lib/CartContext'

export default function ProductPage() {
  const params = useParams()
  const { addToCart, cart, getCartCount } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  
  console.log('Product page - cart:', cart, 'count:', getCartCount())

  useEffect(() => {
    loadProduct(params.slug)
  }, [params.slug])

  const loadProduct = async (productId) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const productDoc = await getDoc(doc(db, 'products', productId))
      if (productDoc.exists()) {
        const productData = { id: productDoc.id, ...productDoc.data() }
        setProduct(productData)
        if (productData.variations && productData.variations.length > 0) {
          setSelectedVariant(productData.variations.find(v => v.available) || productData.variations[0])
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading product:', error)
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    const cartItem = {
      id: selectedVariant ? selectedVariant.variationId || `${product.id}-${selectedVariant.id}` : product.numericId || product.id,
      productId: product.numericId || product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: selectedVariant ? product.default_price * selectedVariant.priceMultiplier : product.default_price,
      image: product.image_url,
      variant: selectedVariant,
      quantity: quantity,
      vendorId: product.vendorId || 'default-vendor',
      vendorName: product.vendorName || 'FreshCuts',
      variationId: selectedVariant?.variationId
    }
    addToCart(cartItem)
    alert('Added to cart!')
  }

  const getCurrentPrice = () => {
    return selectedVariant ? product.default_price * selectedVariant.priceMultiplier : product.default_price
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>
  if (!product) return <div style={{ padding: '20px' }}>Product not found</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <Link href="/customer/marketplace" style={{ 
            color: '#7c2d12', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(124, 45, 18, 0.05)',
            border: '1px solid rgba(124, 45, 18, 0.1)',
            transition: 'all 0.2s ease'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Marketplace
          </Link>
          <Link href="/customer/cart" style={{ 
            color: '#7c2d12',
            textDecoration: 'none',
            position: 'relative',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(124, 45, 18, 0.05)',
            border: '1px solid rgba(124, 45, 18, 0.1)',
            transition: 'all 0.2s ease'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {getCartCount() > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                border: '2px solid white'
              }}>
                {getCartCount()}
              </span>
            )}
          </Link>
        </div>
        
        <div className="product-layout">
          <div>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: '100%', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '100%', height: '400px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                No Image Available
              </div>
            )}
          </div>
          
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ 
                  color: '#92400e', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: 'rgba(146, 64, 14, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>{product.category}</span>
                {product.featured && (
                  <span style={{ 
                    backgroundColor: '#fbbf24', 
                    color: '#92400e', 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Featured
                  </span>
                )}
              </div>
              <h1 style={{ 
                color: '#1f2937', 
                fontSize: '32px', 
                fontWeight: '700',
                fontFamily: 'Playfair Display, serif',
                margin: '0 0 16px 0',
                lineHeight: '1.2'
              }}>{product.name}</h1>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ 
                  color: '#f97316', 
                  fontSize: '36px', 
                  fontWeight: '700', 
                  fontFamily: 'Inter, sans-serif'
                }}>₹{getCurrentPrice().toFixed(0)}</span>
                <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>per {product.baseUnit}</span>
              </div>
            </div>
            
            {/* Variants Selection */}
            {product.variations && product.variations.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  marginBottom: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  Select Size
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {product.variations.filter(v => v.available).map(variant => (
                    <button
                      key={variant.variationId || variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      style={{
                        padding: '16px 12px',
                        backgroundColor: selectedVariant?.variationId === variant.variationId ? '#f97316' : 'white',
                        color: selectedVariant?.variationId === variant.variationId ? 'white' : '#374151',
                        border: `2px solid ${selectedVariant?.variationId === variant.variationId ? '#f97316' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedVariant?.variationId === variant.variationId ? '0 4px 12px rgba(249, 115, 22, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ fontSize: '13px', marginBottom: '4px', opacity: '0.8' }}>{variant.name}</div>
                      <div style={{ fontSize: '12px', marginBottom: '2px', opacity: '0.6' }}>{variant.variationId}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700' }}>₹{(product.default_price * variant.priceMultiplier).toFixed(0)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity Selection */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Quantity
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ 
                    padding: '12px 16px', 
                    backgroundColor: 'white', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '12px 0 0 12px', 
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <div style={{ 
                  padding: '12px 24px', 
                  border: '2px solid #e5e7eb', 
                  borderLeft: 'none',
                  borderRight: 'none',
                  backgroundColor: 'white',
                  minWidth: '60px', 
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>{quantity}</div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ 
                    padding: '12px 16px', 
                    backgroundColor: 'white', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '0 12px 12px 0', 
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {product.description && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ 
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  Description
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  lineHeight: '1.7',
                  fontSize: '15px',
                  backgroundColor: 'rgba(107, 114, 128, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(107, 114, 128, 0.1)'
                }}>{product.description}</p>
              </div>
            )}
            
            {/* Product Details */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4m6-6h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4m-6 0a2 2 0 0 0-2-2v-3a2 2 0 0 0 2-2m6 0a2 2 0 0 1 2-2v-3a2 2 0 0 1-2-2"/>
                </svg>
                Product Details
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {product.shelfLife && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(34, 197, 94, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(34, 197, 94, 0.1)'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong style={{ color: '#22c55e' }}>Shelf Life:</strong> {product.shelfLife}
                    </span>
                  </div>
                )}
                {product.storageInstructions && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <path d="M2.5 2v6h6M21.5 22v-6h-6"/>
                      <path d="M22 11.5A10.5 10.5 0 1 1 11.5 1a10.5 10.5 0 0 1 10.5 10.5z"/>
                    </svg>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      <strong style={{ color: '#3b82f6' }}>Storage:</strong> {product.storageInstructions}
                    </span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(249, 115, 22, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    <strong style={{ color: '#f97316' }}>Base Unit:</strong> {product.baseUnit}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleAddToCart}
              style={{
                width: '100%',
                padding: '18px 24px',
                backgroundColor: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Add {quantity} to Cart • ₹{(getCurrentPrice() * quantity).toFixed(0)}
            </button>
            
            {/* Cart Status */}
            {getCartCount() > 0 && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: 'rgba(34, 197, 94, 0.05)', 
                borderRadius: '12px', 
                fontSize: '14px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <div>
                  <div style={{ fontWeight: '600', color: '#22c55e', marginBottom: '4px' }}>
                    {getCartCount()} items in cart
                  </div>
                  {cart.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {cart.slice(0, 2).map(item => (
                        <span key={item.id}>{item.name.split(' - ')[0]} ×{item.quantity}</span>
                      )).join(', ')}
                      {cart.length > 2 && ` +${cart.length - 2} more`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}