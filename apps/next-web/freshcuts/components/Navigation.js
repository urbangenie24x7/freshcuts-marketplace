import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCurrentUser, logout } from '../lib/auth'
import { useCart } from '../lib/CartContext'

export default function Navigation() {
  const [user, setUser] = useState(null)
  const [brandLogo, setBrandLogo] = useState(null)
  const [logoHeight, setLogoHeight] = useState(40)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getCartCount, cart } = useCart()
  
  console.log('Navigation cart count:', getCartCount(), 'cart items:', cart)

  useEffect(() => {
    setUser(getCurrentUser())
    loadBrandLogo()
  }, [])

  const loadBrandLogo = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase.client')
      
      const brandSnap = await getDocs(collection(db, 'brandSettings'))
      if (brandSnap.docs.length > 0) {
        const brandData = brandSnap.docs[0].data()
        setBrandLogo(brandData.logo)
        setLogoHeight(brandData.logoHeight || 40)
      }
    } catch (error) {
      console.error('Error loading brand logo:', error)
    }
  }

  return (
    <>
      <nav className="nav-container">
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <Link href="/customer/marketplace" className="nav-logo">
            {brandLogo ? (
              <img 
                src={brandLogo} 
                alt="FreshCuts" 
                style={{ 
                  height: `${logoHeight}px`, 
                  maxHeight: '50px',
                  objectFit: 'contain'
                }} 
              />
            ) : (
              'FreshCuts'
            )}
          </Link>

          {/* Desktop Menu */}
          <div className="nav-desktop-menu">
            {user ? (
              <>
                {user.role === 'customer' && (
                  <>
                    <Link href="/customer/marketplace" style={{ 
                      color: '#7c2d12', 
                      textDecoration: 'none', 
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Shop
                    </Link>
                    <Link href="/customer/cart" style={{ 
                      color: '#7c2d12', 
                      textDecoration: 'none', 
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
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
                          top: '2px',
                          right: '2px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          border: '2px solid white'
                        }}>
                          {getCartCount()}
                        </span>
                      )}
                    </Link>
                    <Link href="/customer/orders" style={{ 
                      color: '#7c2d12', 
                      textDecoration: 'none', 
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                      </svg>
                      Orders
                    </Link>
                  </>
                )}
                {user.role === 'vendor' && (
                  <Link href="/vendor" style={{ 
                    color: '#7c2d12', 
                    textDecoration: 'none', 
                    padding: '8px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                  </Link>
                )}
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link href="/admin" style={{ 
                    color: '#7c2d12', 
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </Link>
                )}
                <Link href={user.role === 'vendor' ? '/vendor/profile' : user.role === 'admin' || user.role === 'super_admin' ? '/admin/profile' : '/customer/profile'} style={{ 
                  color: '#7c2d12', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    // Cart will be preserved per user, just logout
                    logout()
                  }}
                  style={{
                    backgroundColor: 'rgba(124, 45, 18, 0.1)',
                    color: '#7c2d12',
                    border: '1px solid rgba(124, 45, 18, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/customer/marketplace" style={{ 
                  color: '#7c2d12', 
                  textDecoration: 'none', 
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Shop
                </Link>
                <Link href="/customer/cart" style={{ 
                  color: '#7c2d12', 
                  textDecoration: 'none', 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
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
                      top: '2px',
                      right: '2px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      border: '2px solid white'
                    }}>
                      {getCartCount()}
                    </span>
                  )}
                </Link>
                <Link href="/customer/login" style={{
                  color: '#7c2d12',
                  textDecoration: 'none',
                  fontSize: '14px',
                  border: '1px solid rgba(124, 45, 18, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '500',
                  backgroundColor: 'rgba(124, 45, 18, 0.1)',
                  transition: 'all 0.2s ease'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Cart */}
          <div className="nav-mobile-controls">
            {/* Mobile Cart */}
            <Link href="/customer/cart" style={{ 
              color: '#7c2d12', 
              textDecoration: 'none', 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '8px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {getCartCount() > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}>
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#7c2d12',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderTop: '1px solid rgba(124, 45, 18, 0.1)',
            zIndex: 999
          }}>
            <div style={{ padding: '20px' }}>
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {user.role === 'customer' && (
                    <>
                      <Link href="/customer/marketplace" style={{ 
                        color: '#7c2d12', 
                        textDecoration: 'none', 
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(124, 45, 18, 0.1)'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Shop
                      </Link>
                      <Link href="/customer/orders" style={{ 
                        color: '#7c2d12', 
                        textDecoration: 'none', 
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(124, 45, 18, 0.1)'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                        Orders
                      </Link>
                      <Link href="/customer/profile" style={{ 
                        color: '#7c2d12', 
                        textDecoration: 'none', 
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(124, 45, 18, 0.1)'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Profile
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      // Cart will be preserved per user, just logout
                      logout()
                    }}
                    style={{
                      backgroundColor: 'rgba(124, 45, 18, 0.1)',
                      color: '#7c2d12',
                      border: '1px solid rgba(124, 45, 18, 0.3)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '500',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Link href="/customer/marketplace" style={{ 
                    color: '#7c2d12', 
                    textDecoration: 'none', 
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(124, 45, 18, 0.1)'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Shop
                  </Link>
                  <Link href="/customer/login" style={{
                    color: '#7c2d12',
                    textDecoration: 'none',
                    fontSize: '16px',
                    border: '1px solid rgba(124, 45, 18, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500',
                    backgroundColor: 'rgba(124, 45, 18, 0.1)',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 998
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}