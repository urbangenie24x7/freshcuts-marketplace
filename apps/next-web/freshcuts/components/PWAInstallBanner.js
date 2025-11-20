import { useState, useEffect } from 'react'

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
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
    }
  }

  if (!showBanner) return null

  return (
    <div style={{
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
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
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://freshcuts.urbangenie24x7.com')}`}
          alt="QR Code for FreshCuts App"
          style={{ 
            width: '120px', 
            height: '120px',
            border: '2px solid #16a34a',
            borderRadius: '8px'
          }}
        />
        <p style={{ 
          fontSize: '12px', 
          color: '#16a34a', 
          margin: '8px 0 0 0',
          fontWeight: '600'
        }}>
          Scan to Install
        </p>
      </div>

      {/* Install Content */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>📱</span>
          <h3 style={{ 
            color: '#16a34a', 
            fontSize: '18px', 
            fontWeight: '700',
            margin: '0'
          }}>
            Install FreshCuts App
          </h3>
        </div>
        <p style={{ 
          color: '#15803d', 
          fontSize: '14px', 
          margin: '0 0 12px 0',
          lineHeight: '1.4'
        }}>
          Get faster access, better experience, and instant notifications. Works offline too!
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              style={{
                backgroundColor: '#16a34a',
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
              Install Now
            </button>
          )}
          
          <button
            onClick={() => setShowBanner(false)}
            style={{
              backgroundColor: 'transparent',
              color: '#16a34a',
              border: '1px solid #16a34a',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}