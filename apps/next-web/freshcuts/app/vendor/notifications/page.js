'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function VendorNotifications() {
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const user = requireAuth(['vendor'])
    if (!user) return
    setMounted(true)
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const currentUser = JSON.parse(localStorage.getItem('currentUser'))
      const notificationsSnap = await getDocs(query(collection(db, 'notifications'), where('vendorId', '==', currentUser.id)))
      setNotifications(notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '20px' }}>Notifications</h1>
        <div style={{ display: 'grid', gap: '15px' }}>
          {notifications.map(notification => (
            <div key={notification.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <p>Date: {notification.createdAt?.toDate?.()?.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}