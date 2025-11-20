'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../../../lib/CartContext'
import Navigation from '../../../components/Navigation'
import CheckoutFlow from '../../../components/CheckoutFlow'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart, getCartCount } = useCart()
  
  console.log('Cart page - cart items:', cart, 'count:', getCartCount())
  const [mounted, setMounted] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()

  // Group cart items by vendor
  const groupedCart = cart.reduce((groups, item) => {
    const vendorId = item.vendorId || 'default-vendor'
    if (!groups[vendorId]) {
      groups[vendorId] = {
        vendorName: item.vendorName || 'FreshCuts',
        items: [],
        total: 0
      }
    }
    groups[vendorId].items.push(item)
    groups[vendorId].total += item.price * item.quantity
    return groups
  }, {})

  useEffect(() => {
    setMounted(true)
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    setCurrentUser(user)
  }, [])

  const handleCheckout = () => {
    if (!currentUser) {
      router.push('/customer/login')
      return
    }
    setShowCheckout(true)
  }

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '32px', margin: '0' }}>Shopping Cart</h1>
          <Link href="/customer/marketplace" style={{ color: '#16a34a', textDecoration: 'none' }}>
            ← Continue Shopping
          </Link>
        </div>
        
        {(!cart || cart.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ color: '#6b7280', marginBottom: '20px' }}>Your cart is empty</h2>
            <Link href="/customer/marketplace" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            {/* Cart Items Grouped by Vendor */}
            <div>
              {Object.entries(groupedCart).map(([vendorId, vendorGroup]) => (
                <div key={vendorId} style={{ marginBottom: '30px' }}>
                  {/* Vendor Header */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ margin: '0', color: '#1e293b', fontSize: '18px' }}>
                      🏪 {vendorGroup.vendorName}
                    </h3>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                      Subtotal: ₹{vendorGroup.total.toFixed(0)}
                    </p>
                  </div>
                  
                  {/* Vendor Items */}
                  {vendorGroup.items.map(item => (
                <div key={item.id} style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  marginBottom: '15px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  {/* Product Image */}
                  <div>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#16a34a', fontWeight: '600' }}>₹{item.price} each</p>
                    
                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Quantity:</span>
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', minWidth: '40px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Item Total and Remove */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1f2937' }}>Order Summary</h2>
              
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Items ({cart.length}):</span>
                  <span>₹{getCartTotal()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Delivery:</span>
                  <span style={{ color: '#16a34a' }}>Free</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                <span>Total:</span>
                <span style={{ color: '#16a34a' }}>₹{getCartTotal()}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                Proceed to Checkout
              </button>
              
              <button
                onClick={clearCart}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
        
        {/* Multi-Vendor Checkout Flow */}
        {showCheckout && (
          <CheckoutFlow
            cartItems={cart}
            currentUser={currentUser}
            onComplete={(orderData) => {
              clearCart()
              setShowCheckout(false)
              router.push('/customer/order-confirmation')
            }}
            onCancel={() => setShowCheckout(false)}
          />
        )}
      </div>
    </>
  )
}