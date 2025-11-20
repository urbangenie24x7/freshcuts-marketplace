import { useState } from 'react'

export default function SimpleAddressInput({ placeholder, value, onAddressSelect }) {
  const [inputValue, setInputValue] = useState(value || '')

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Simple callback with basic address data
    if (onAddressSelect) {
      onAddressSelect({
        locality: newValue,
        city: 'Hyderabad',
        postal_code: '',
        lat: 17.4065,
        lng: 78.4772
      })
    }
  }

  return (
    <input
      type="text"
      placeholder={placeholder || "Enter area/locality"}
      value={inputValue}
      onChange={handleInputChange}
      style={{
        width: '100%',
        padding: '8px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '14px'
      }}
    />
  )
}