import { useState, useEffect } from 'react'

export default function VendorPWABanner() {
  const [showBanner, setShowBanner] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Update manifest to vendor-specific one
    const manifestLink = document.querySelector('link[rel="manifest"]')
    if (manifestLink) {
      manifestLink.href = '/vendor-manifest.json'
    }
    
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      // Mobile-specific install instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      if (isIOS) {
        alert('To install on iPhone/iPad:\n1. Tap Share button (⬆️)\n2. Select "Add to Home Screen"\n3. Tap "Add"')
      } else if (isAndroid) {
        alert('To install on Android:\n1. Tap menu (⋮) in browser\n2. Select "Add to Home screen"\n3. Tap "Add"')
      } else {
        alert('To install:\n1. Look for install icon in address bar\n2. Or use browser menu > "Install app"')
      }
    }
  }

  if (!showBanner) return null

  return (
    <div style={{
      backgroundColor: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* QR Code */}
      <div style={{ textAlign: 'center' }}>
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://freshcuts.urbangenie24x7.com/vendor/login')}`}
          alt="QR Code for Vendor Dashboard"
          style={{ 
            width: '120px', 
            height: '120px',
            border: '2px solid #f59e0b',
            borderRadius: '8px'
          }}
        />
        <p style={{ 
          fontSize: '12px', 
          color: '#92400e', 
          margin: '8px 0 0 0',
          fontWeight: '600'
        }}>
          Scan for Quick Access
        </p>
      </div>

      {/* Install Content */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🏪</span>
          <h3 style={{ 
            color: '#92400e', 
            fontSize: '18px', 
            fontWeight: '700',
            margin: '0'
          }}>
            Install Vendor Dashboard
          </h3>
        </div>
        <p style={{ 
          color: '#b45309', 
          fontSize: '14px', 
          margin: '0 0 12px 0',
          lineHeight: '1.4'
        }}>
          Quick access to manage products, orders, and earnings. Works like a native app!
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleInstall}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⬇️</span>
            {deferredPrompt ? 'Install Dashboard' : 'Install Instructions'}
          </button>
          
          <button
            onClick={() => setShowBanner(false)}
            style={{
              backgroundColor: 'transparent',
              color: '#92400e',
              border: '1px solid #92400e',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}