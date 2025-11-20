'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OTPLogin from '../../../components/OTPLogin'

export default function CustomerLogin() {
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      const user = JSON.parse(currentUser)
      if (user.role === 'customer') {
        router.push('/customer/marketplace')
      }
    }
  }, [])

  const handleLogin = (user) => {
    router.push('/customer/marketplace')
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
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%', 
        maxWidth: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0 0 8px 0' }}>FreshCuts</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Fresh meat delivered to your doorstep</p>
        </div>

        <OTPLogin onLogin={handleLogin} userType="customer" />
      </div>
    </div>
  )
}