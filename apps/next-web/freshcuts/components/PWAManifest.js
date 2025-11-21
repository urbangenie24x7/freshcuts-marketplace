'use client'

import { useEffect } from 'react'
import { getCurrentUser } from '../lib/auth'

export default function PWAManifest() {
  useEffect(() => {
    const updateManifest = () => {
      const user = getCurrentUser()
      let manifestPath = '/manifest.json'
      let themeColor = '#f97316'
      
      if (user?.role === 'vendor') {
        manifestPath = '/vendor-manifest.json'
        themeColor = '#16a34a'
      } else if (user?.role === 'admin' || user?.role === 'super_admin') {
        manifestPath = '/admin-manifest.json'
        themeColor = '#3b82f6'
      }
      
      // Update manifest link
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        manifestLink.href = manifestPath
      }
      
      // Update theme color
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
        themeColorMeta.content = themeColor
      }
    }
    
    updateManifest()
    
    // Listen for storage changes (login/logout)
    window.addEventListener('storage', updateManifest)
    return () => window.removeEventListener('storage', updateManifest)
  }, [])
  
  return null
}