// Location service for Google Places integration
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in kilometers
}

export const geocodeAddress = async (address) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  // Validate and sanitize address input
  if (!address || typeof address !== 'string' || address.length > 200) {
    throw new Error('Invalid address format')
  }

  const sanitizedAddress = address.replace(/[<>"'&]/g, '')
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', sanitizedAddress)
  url.searchParams.set('key', apiKey)
  
  const response = await fetch(url.toString())
  
  if (!response.ok) {
    throw new Error('Geocoding service unavailable')
  }
  
  const data = await response.json()
  
  if (data.status === 'OK' && data.results.length > 0) {
    const location = data.results[0].geometry.location
    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: data.results[0].formatted_address
    }
  }
  
  throw new Error('Address not found')
}

export const reverseGeocode = async (lat, lng) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  // Validate coordinates
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  
  if (isNaN(latitude) || isNaN(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    throw new Error('Invalid coordinates')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${latitude},${longitude}`)
  url.searchParams.set('key', apiKey)
  
  const response = await fetch(url.toString())
  
  if (!response.ok) {
    throw new Error('Reverse geocoding service unavailable')
  }
  
  const data = await response.json()
  
  if (data.status === 'OK' && data.results.length > 0) {
    return {
      formatted_address: data.results[0].formatted_address,
      components: data.results[0].address_components
    }
  }
  
  throw new Error('Location not found')
}