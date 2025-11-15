import { useState } from 'react'
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete'

export default function AddressInput({ onAddressSelect, initialAddress = {} }) {
  const [useManualInput, setUseManualInput] = useState(false)
  const [manualAddress, setManualAddress] = useState({
    flatNo: initialAddress.flatNo || '',
    buildingName: initialAddress.buildingName || '',
    streetName: initialAddress.streetName || '',
    locality: initialAddress.locality || '',
    city: initialAddress.city || '',
    pincode: initialAddress.pincode || '',
    landmark: initialAddress.landmark || ''
  })

  const handleGooglePlaceSelect = (placeData) => {
    onAddressSelect({
      formatted_address: placeData.formatted_address,
      flatNo: '',
      buildingName: '',
      streetName: placeData.street_address || '',
      locality: placeData.locality || '',
      city: placeData.city || '',
      pincode: placeData.postal_code || '',
      landmark: '',
      lat: placeData.lat,
      lng: placeData.lng
    })
  }

  const handleManualSubmit = () => {
    const fullAddress = [
      manualAddress.flatNo,
      manualAddress.buildingName,
      manualAddress.streetName,
      manualAddress.locality,
      manualAddress.city,
      manualAddress.pincode
    ].filter(Boolean).join(', ')

    onAddressSelect({
      formatted_address: fullAddress,
      ...manualAddress,
      lat: null,
      lng: null
    })
  }

  const handleInputChange = (field, value) => {
    setManualAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (useManualInput) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: '0', fontSize: '16px', color: '#374151' }}>Enter Address Manually</h4>
          <button
            onClick={() => setUseManualInput(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#16a34a',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Use Google Places
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Flat/House No."
              value={manualAddress.flatNo}
              onChange={(e) => handleInputChange('flatNo', e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Building/Society Name"
              value={manualAddress.buildingName}
              onChange={(e) => handleInputChange('buildingName', e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <input
            type="text"
            placeholder="Street Name/Road"
            value={manualAddress.streetName}
            onChange={(e) => handleInputChange('streetName', e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Area/Locality"
              value={manualAddress.locality}
              onChange={(e) => handleInputChange('locality', e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Pincode"
              value={manualAddress.pincode}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <input
            type="text"
            placeholder="City"
            value={manualAddress.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />

          <input
            type="text"
            placeholder="Landmark (Optional)"
            value={manualAddress.landmark}
            onChange={(e) => handleInputChange('landmark', e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />

          <button
            onClick={handleManualSubmit}
            disabled={!manualAddress.streetName || !manualAddress.locality || !manualAddress.city || !manualAddress.pincode}
            style={{
              padding: '12px',
              backgroundColor: (!manualAddress.streetName || !manualAddress.locality || !manualAddress.city || !manualAddress.pincode) ? '#9ca3af' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (!manualAddress.streetName || !manualAddress.locality || !manualAddress.city || !manualAddress.pincode) ? 'not-allowed' : 'pointer'
            }}
          >
            Save Address
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: '0', fontSize: '16px', color: '#374151' }}>Search Address</h4>
        <button
          onClick={() => setUseManualInput(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#16a34a',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Enter Manually
        </button>
      </div>

      <GooglePlacesAutocomplete
        onPlaceSelect={handleGooglePlaceSelect}
        placeholder="Start typing your address..."
      />

      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        💡 Start typing to search for your address, or click "Enter Manually" if search is not working
      </p>
    </div>
  )
}