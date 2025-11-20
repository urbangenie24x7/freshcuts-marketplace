'use client'

import Link from 'next/link'
import { useCart } from '../lib/CartContext'

export default function FloatingCart() {
  const { getCartCount, getCartTotal } = useCart()

  if (getCartCount() === 0) return null

  return (
    <Link href="/customer/cart" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#16a34a',
      color: 'white',
      borderRadius: '25px',
      padding: '15px 20px',
      textDecoration: 'none',
      boxShadow: '0 8px 25px rgba(22, 163, 74, 0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      border: '2px solid rgba(255,255,255,0.2)',
      minWidth: '140px'
    }}>
      <span style={{ fontSize: '20px' }}>🛒</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '14px', lineHeight: '1' }}>{getCartCount()} items</span>
        <span style={{ fontSize: '16px', fontWeight: '700', lineHeight: '1' }}>₹{getCartTotal()}</span>
      </div>
    </Link>
  )
}