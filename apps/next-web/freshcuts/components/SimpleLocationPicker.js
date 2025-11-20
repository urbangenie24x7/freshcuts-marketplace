'use client'

import { useState } from 'react'

export default function SimpleLocationPicker({ onLocationSelect, onClose }) {
  const [location, setLocation] = useState({ lat: '', lng: '', address: '' })
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          // Try to get address from coordinates using a free service
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
            const data = await response.json()
            const address = data.display_name || `${lat}, ${lng}`
            
            setLocation({ lat, lng, address })
          } catch (error) {
            console.error('Error getting address:', error)
            setLocation({ lat, lng, address: `${lat}, ${lng}` })
          }
          setLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please enter manually.')
          setLoading(false)
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
      setLoading(false)
    }
  }

  const handleManualEntry = () => {
    const lat = parseFloat(location.lat)
    const lng = parseFloat(location.lng)
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude')
      return
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (Lat: -90 to 90, Lng: -180 to 180)')
      return
    }
    
    onLocationSelect({
      lat,
      lng,
      address: location.address || `${lat}, ${lng}`
    })
    onClose()
  }

  const handleUseLocation = () => {
    if (location.lat && location.lng) {
      onLocationSelect(location)
      onClose()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#374151' }}>
          Select Location
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Getting Location...' : '📍 Use Current Location'}
          </button>
          
          {location.lat && location.lng && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                Location Found:
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#374151' }}>
                <strong>Address:</strong> {location.address}
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#374151' }}>
                <strong>Coordinates:</strong> {location.lat}, {location.lng}
              </p>
              <button
                onClick={handleUseLocation}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Use This Location
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#374151' }}>
            Or Enter Manually:
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#6b7280' }}>
                Latitude:
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g., 17.3850"
                value={location.lat}
                onChange={(e) => setLocation(prev => ({ ...prev, lat: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#6b7280' }}>
                Longitude:
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g., 78.4867"
                value={location.lng}
                onChange={(e) => setLocation(prev => ({ ...prev, lng: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#6b7280' }}>
              Address Description (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g., Near Metro Station, Hyderabad"
              value={location.address}
              onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <button
            onClick={handleManualEntry}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Use Manual Location
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}