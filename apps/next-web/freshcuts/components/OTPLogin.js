import { useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sendOTP, verifyOTP } from '../lib/otpService'

export default function OTPLogin({ onLogin, userType = 'customer' }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone', 'otp', 'profile', 'email-verify'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/[^0-9]/g, '')
    // Limit to 10 digits
    return digits.slice(0, 10)
  }

  const getFullPhoneNumber = (phoneNumber) => {
    const cleanPhone = formatPhoneNumber(phoneNumber)
    return `+91${cleanPhone}`
  }

  const handleSendOTP = async () => {
    const cleanPhone = formatPhoneNumber(phone)
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const cleanPhone = formatPhoneNumber(phone)
      const result = await sendOTP(cleanPhone)
      if (result.success) {
        setStep('otp')
      } else {
        setError('Failed to send OTP. Please try again.')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    }
    
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const cleanPhone = formatPhoneNumber(phone)
      
      // Firebase OTP verification required
      if (!db) {
        setError('Firebase connection required. Please check configuration.')
        setLoading(false)
        return
      }
      
      const verifyResult = await verifyOTP(cleanPhone, otp)
      if (!verifyResult.success) {
        setError(verifyResult.error)
        setLoading(false)
        return
      }

      // Find user by phone - use format without +91 (as stored in database)
      const searchPhone = formatPhoneNumber(phone) // 9876543219
      
      if (userType === 'vendor') {
        // For vendors, search with clean phone number
        console.log('🔍 Searching for vendor with phone:', searchPhone)
        const vendorQuery = query(
          collection(db, 'vendors'),
          where('phone', '==', searchPhone)
        )
        const vendorSnap = await getDocs(vendorQuery)
        
        console.log('📊 Vendor query results:', vendorSnap.size, 'documents found')
        
        if (!vendorSnap.empty) {
          const vendorData = vendorSnap.docs[0].data()
          console.log('✅ Vendor found:', vendorData.name || vendorData.businessProfile?.businessName)
          const user = { id: vendorSnap.docs[0].id, ...vendorData }
          localStorage.setItem('currentUser', JSON.stringify(user))
          onLogin(user)
        } else {
          console.log('❌ No vendor found with phone:', searchPhone)
          setError('No vendor account found with this phone number')
        }
      } else {
        // For customers and admins, search with clean phone number
        console.log('🔍 Searching for user with phone:', searchPhone)
        const userQuery = query(
          collection(db, 'users'),
          where('phone', '==', searchPhone)
        )
        const userSnap = await getDocs(userQuery)
        
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data()
          // Default role to customer if not set
          const userRole = userData.role || 'customer'
          const user = { id: userSnap.docs[0].id, ...userData, role: userRole }
          
          // Check user type
          if (userType !== 'customer' && userRole !== userType) {
            setError(`Access denied. This is for ${userType}s only.`)
            setLoading(false)
            return
          }
          
          localStorage.setItem('currentUser', JSON.stringify(user))
          onLogin(user)
        } else {
          // For new customers, collect profile info
          if (userType === 'customer') {
            setIsNewUser(true)
            setStep('profile')
          } else {
            setError(`No ${userType} account found with this phone number`)
          }
        }
      }
    } catch (error) {
      setError('Verification failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handleProfileSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setStep('email-verify')
    setLoading(false)
  }

  const handleEmailVerify = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Firebase connection required
      if (!db) {
        setError('Firebase connection required. Please check configuration.')
        setLoading(false)
        return
      }
      
      if (emailOtp === '123456') {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
        
        const newUser = {
          phone: formatPhoneNumber(phone), // Store without +91 prefix
          role: 'customer', // Mandatory role field
          name: name.trim(),
          email: email.trim(),
          emailVerified: true,
          createdAt: serverTimestamp(),
          status: 'active' // Additional status field
        }
        
        const docRef = await addDoc(collection(db, 'users'), newUser)
        const user = { id: docRef.id, ...newUser }
        
        localStorage.setItem('currentUser', JSON.stringify(user))
        onLogin(user)
      } else {
        setError('Invalid verification code. Use 123456 for demo.')
      }
    } catch (error) {
      console.error('Firebase error:', error)
      setError('Firebase connection failed. Please check configuration.')
    }
    
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>

      
      {step === 'phone' ? (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                fontSize: '16px',
                fontWeight: '500',
                zIndex: 1,
                pointerEvents: 'none'
              }}>
                +91
              </div>
              <input
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                maxLength="10"
                style={{
                  width: '100%',
                  padding: '16px 20px 16px 60px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#fafafa',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#16a34a'
                  e.target.style.backgroundColor = 'white'
                  e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.backgroundColor = '#fafafa'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

          </div>
          
          {error && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '14px', 
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          <button
            onClick={handleSendOTP}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading ? '#9ca3af' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#15803d'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#16a34a'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Sending...
              </>
            ) : (
              <>
                🚀 Send Verification Code
              </>
            )}
          </button>
        </div>
      ) : step === 'profile' ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '20px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Complete Your Profile
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 24px 0'
            }}>
              Please provide your name and email to continue
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backgroundColor: '#fafafa',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backgroundColor: '#fafafa',
                outline: 'none'
              }}
            />
          </div>
          
          {error && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '14px', 
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px'
            }}>
              {error}
            </div>
          )}
          
          <button
            onClick={handleProfileSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📧 Verify Email & Continue
          </button>
        </div>
      ) : step === 'email-verify' ? (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <input
              type="text"
              placeholder="000000"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value)}
              maxLength="6"
              style={{
                width: '100%',
                padding: '20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: '8px'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              For testing, use: <strong>123456</strong>
            </p>
          </div>
          
          {error && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '14px', 
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
          
          <button
            onClick={handleEmailVerify}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            ✓ Complete Registration
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              fontSize: '14px',
              color: '#374151'
            }}>
              🔐 Verification Code
            </label>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Enter the 6-digit code sent to <strong>+91{phone}</strong>
            </p>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              style={{
                width: '100%',
                padding: '20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: '8px',
                backgroundColor: '#fafafa',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#16a34a'
                e.target.style.backgroundColor = 'white'
                e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.backgroundColor = '#fafafa'
                e.target.style.boxShadow = 'none'
              }}
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '8px',
              textAlign: 'center',
              margin: '8px 0 0 0'
            }}>
              🧪 For testing, use: <strong>123456</strong>
            </p>
          </div>
          
          {error && (
            <div style={{ 
              color: '#dc2626', 
              fontSize: '14px', 
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          <button
            onClick={handleVerifyOTP}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading ? '#9ca3af' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#15803d'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#16a34a'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Verifying...
              </>
            ) : (
              <>
                ✓ Verify & Sign In
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setStep('phone')
              setOtp('')
              setError('')
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb'
              e.target.style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#6b7280'
            }}
          >
            ← Change Phone Number
          </button>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}