import { useEffect, useRef, useState } from 'react'

export default function GoogleMapLocationPicker({ onLocationSelect, onClose, addressDetails = {} }) {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initializeMap()
    } else {
      loadGoogleMapsScript()
    }
  }, [])

  const loadGoogleMapsScript = () => {
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('Google Maps API key not configured')
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = initializeMap
    script.onerror = () => console.error('Failed to load Google Maps API')
    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    // Try to geocode provided address details first
    const constructedAddress = [
      addressDetails.flatNo,
      addressDetails.buildingName,
      addressDetails.streetName,
      addressDetails.locality,
      addressDetails.city,
      addressDetails.pincode
    ].filter(Boolean).join(', ')

    if (constructedAddress.length > 10) {
      // Geocode the constructed address
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: constructedAddress }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          }
          createMap(location)
          setAddress(results[0].formatted_address)
        } else {
          // Fallback to current location or default
          getCurrentLocationOrDefault()
        }
      })
    } else {
      getCurrentLocationOrDefault()
    }
  }

  const getCurrentLocationOrDefault = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          createMap(userLocation)
        },
        () => {
          createMap({ lat: 12.9716, lng: 77.5946 })
        }
      )
    } else {
      createMap({ lat: 12.9716, lng: 77.5946 })
    }
  }

  const createMap = (center) => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    const markerInstance = new window.google.maps.Marker({
      position: center,
      map: mapInstance,
      draggable: true,
      title: 'Drag to select location'
    })

    setMap(mapInstance)
    setMarker(markerInstance)
    setSelectedLocation(center)
    reverseGeocode(center)

    // Add click listener to map
    mapInstance.addListener('click', (event) => {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      }
      markerInstance.setPosition(location)
      setSelectedLocation(location)
      reverseGeocode(location)
    })

    // Add drag listener to marker
    markerInstance.addListener('dragend', (event) => {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      }
      setSelectedLocation(location)
      reverseGeocode(location)
    })
  }

  const reverseGeocode = async (location) => {
    if (!window.google) return

    const geocoder = new window.google.maps.Geocoder()
    try {
      const response = await geocoder.geocode({ location })
      if (response.results[0]) {
        setAddress(response.results[0].formatted_address)
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
    }
  }

  const handleConfirm = () => {
    if (selectedLocation && address) {
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address
      })
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
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: '0', fontSize: '18px', color: '#374151' }}>Select Location</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '300px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}
        />

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Selected Address:
          </label>
          <p style={{
            padding: '10px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#374151',
            margin: '0',
            minHeight: '40px'
          }}>
            {address || 'Loading address...'}
          </p>
        </div>

        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '15px' }}>
          💡 Click on the map or drag the marker to select your exact location
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation || !address}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedLocation && address ? '#16a34a' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedLocation && address ? 'pointer' : 'not-allowed'
            }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}