import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import OTPLogin from '../../components/OTPLogin'
import { checkFirebaseConnection } from '../../lib/firebaseCheck'

export default function VendorLogin() {
  const router = useRouter()
  const [firebaseStatus, setFirebaseStatus] = useState({ checking: true, connected: false, error: null })

  useEffect(() => {
    // Check Firebase connection first
    checkFirebaseConnection().then(({ connected, error }) => {
      setFirebaseStatus({ checking: false, connected, error })
    })
    
    // Check if vendor is already logged in
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser)
        if (user.role === 'vendor' && user.id && user.phone) {
          router.push('/vendor/dashboard')
        }
      } catch {
        localStorage.removeItem('currentUser')
      }
    }
  }, [])

  const handleLogin = (user) => {
    router.push('/vendor/dashboard')
  }

  // Show Firebase connection status
  if (firebaseStatus.checking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
          <p style={{ color: '#6b7280' }}>Connecting to Firebase...</p>
        </div>
      </div>
    )
  }

  if (!firebaseStatus.connected) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          padding: '32px 40px', 
          borderRadius: '24px', 
          width: '100%', 
          maxWidth: '420px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔥</div>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Firebase Connection Required</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {firebaseStatus.error || 'Unable to connect to Firebase. Please check configuration.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '32px 40px', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        width: '100%', 
        maxWidth: '420px',
        position: 'relative',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '140px',
            height: '140px',
            backgroundColor: '#f8fafc',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <img 
              src="https://res.cloudinary.com/dwxk3blcb/image/upload/v1762799836/freshcuts/logos/t5u5oj5d8rsltoeexxka.png" 
              alt="FreshCuts Logo"
              style={{ height: '100px', objectFit: 'contain' }}
            />
          </div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px', 
            fontWeight: '400',
            lineHeight: '1.4'
          }}>Vendor Portal</p>
        </div>

        <OTPLogin onLogin={handleLogin} userType="vendor" />
        
        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px', 
          paddingTop: '24px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            lineHeight: '1.5',
            margin: '0'
          }}>
            For vendor support, contact: support@freshcuts.com
          </p>
        </div>
      </div>
    </div>
  )
}