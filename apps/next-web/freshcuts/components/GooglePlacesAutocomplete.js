import { useEffect, useRef, useState } from 'react'

export default function GooglePlacesAutocomplete({ onPlaceSelect, placeholder = "Enter address", value = "" }) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initializeAutocomplete()
    } else {
      loadGoogleMapsScript()
    }
  }, [])

  useEffect(() => {
    setInputValue(value)
  }, [value])

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
    script.onload = initializeAutocomplete
    script.onerror = () => console.error('Failed to load Google Maps API')
    document.head.appendChild(script)
  }

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'IN' }
    })

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect)
  }

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace()
    
    if (!place.geometry) return

    const addressComponents = place.address_components || []
    const formattedAddress = place.formatted_address || ''
    
    // Extract address components
    let streetNumber = ''
    let route = ''
    let locality = ''
    let city = ''
    let state = ''
    let postalCode = ''
    let country = ''

    addressComponents.forEach(component => {
      const types = component.types
      if (types.includes('street_number')) streetNumber = component.long_name
      if (types.includes('route')) route = component.long_name
      if (types.includes('sublocality_level_1') || types.includes('locality')) locality = component.long_name
      if (types.includes('administrative_area_level_2')) city = component.long_name
      if (types.includes('administrative_area_level_1')) state = component.long_name
      if (types.includes('postal_code')) postalCode = component.long_name
      if (types.includes('country')) country = component.long_name
    })

    const addressData = {
      formatted_address: formattedAddress,
      street_address: `${streetNumber} ${route}`.trim(),
      locality: locality,
      city: city || locality,
      state: state,
      postal_code: postalCode,
      country: country,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }

    setInputValue(formattedAddress)
    onPlaceSelect(addressData)
  }

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      style={{
        width: '100%',
        padding: '10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px'
      }}
    />
  )
}