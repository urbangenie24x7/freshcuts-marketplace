'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminSettings() {
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState({
    marginPercentage: 15,
    deliveryFee: 50,
    minOrderAmount: 200,
    maxDeliveryDistance: 10,
    platformName: 'FreshCuts',
    supportPhone: '+91-9876543210',
    supportEmail: 'support@freshcuts.com'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      const settingsSnap = await getDocs(collection(db, 'settings'))
      if (settingsSnap.docs.length > 0) {
        setSettings({ ...settings, ...settingsSnap.docs[0].data() })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { collection, getDocs, updateDoc, addDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const settingsSnap = await getDocs(collection(db, 'settings'))
      const settingsData = {
        ...settings,
        updatedAt: new Date()
      }

      if (settingsSnap.docs.length > 0) {
        await updateDoc(doc(db, 'settings', settingsSnap.docs[0].id), settingsData)
      } else {
        await addDoc(collection(db, 'settings'), { ...settingsData, createdAt: new Date() })
      }
      
      alert('Settings updated successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Platform Settings</h1>
        
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  Platform Margin (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.marginPercentage}
                  onChange={(e) => setSettings({...settings, marginPercentage: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={settings.deliveryFee}
                  onChange={(e) => setSettings({...settings, deliveryFee: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={settings.minOrderAmount}
                  onChange={(e) => setSettings({...settings, minOrderAmount: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  Max Delivery Distance (km)
                </label>
                <input
                  type="number"
                  value={settings.maxDeliveryDistance}
                  onChange={(e) => setSettings({...settings, maxDeliveryDistance: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#6b7280' : '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}