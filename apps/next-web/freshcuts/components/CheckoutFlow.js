import { useState, useEffect } from 'react'
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete'
import GoogleMapLocationPicker from './GoogleMapLocationPicker'
import PaymentMethods from './PaymentMethods'
import { sendVendorNotificationSMS } from '../lib/smsService'
import paymentService from '../lib/paymentService'
// Database services imported dynamically

export default function CheckoutFlow({ cartItems, onComplete, onCancel, currentUser, deliveryOptions = {} }) {
  const [step, setStep] = useState('address') // address, payment
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    flatNo: '',
    buildingName: '',
    streetName: '',
    locality: '',
    landmark: '',
    city: 'Hyderabad',
    pincode: '',
    isDefault: false,
    location: null
  })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [timeSlot, setTimeSlot] = useState('')
  const [servicedPincodes, setServicedPincodes] = useState([])
  const [vendorGroups, setVendorGroups] = useState({})
  const [vendorDeliverySettings, setVendorDeliverySettings] = useState({})
  const [cartTotal, setCartTotal] = useState(0)
  const [showMapPicker, setShowMapPicker] = useState(false)

  useEffect(() => {
    loadAddresses()
    loadServicedPincodes()
    groupCartByVendor()
    loadAllVendorDeliverySettings()
    calculateCartTotal()
  }, [])

  const groupCartByVendor = () => {
    const groups = {}
    cartItems.forEach(item => {
      if (!groups[item.vendorId]) {
        groups[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          items: [],
          total: 0
        }
      }
      groups[item.vendorId].items.push(item)
      groups[item.vendorId].total += item.price * item.quantity
    })
    setVendorGroups(groups)
  }

  const loadAllVendorDeliverySettings = async () => {
    if (!cartItems || cartItems.length === 0) return
    
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')
      
      const vendorIds = [...new Set(cartItems.map(item => item.vendorId))]
      const settings = {}
      
      for (const vendorId of vendorIds) {
        const deliveryQuery = query(
          collection(db, 'vendorDeliverySettings'),
          where('vendorId', '==', vendorId)
        )
        const deliverySnap = await getDocs(deliveryQuery)
        
        if (deliverySnap.docs.length > 0) {
          settings[vendorId] = deliverySnap.docs[0].data().settings
        } else {
          // Default settings if vendor hasn't configured
          settings[vendorId] = {
            pickup: { available: true, charges: 0 },
            delivery: { available: true, charges: 35, freeAbove: 500 },
            express: { available: false, charges: 75, freeAbove: 1000 }
          }
        }
      }
      
      setVendorDeliverySettings(settings)
    } catch (error) {
      console.error('Error loading vendor delivery settings:', error)
    }
  }

  const calculateCartTotal = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    setCartTotal(total)
  }

  const calculateTotalDeliveryCharges = () => {
    let totalCharges = 0
    Object.keys(vendorGroups).forEach(vendorId => {
      const selectedOption = deliveryOptions[vendorId] || 'delivery'
      const vendorTotal = vendorGroups[vendorId].total
      
      if (selectedOption === 'delivery') {
        totalCharges += vendorTotal >= 500 ? 0 : 35
      } else if (selectedOption === 'express') {
        totalCharges += vendorTotal >= 1000 ? 0 : 75
      }
      // pickup is free
    })
    return totalCharges
  }

  const calculateTotalTax = () => {
    return Math.round(cartTotal * 0.05)
  }

  const calculateGrandTotal = () => {
    return cartTotal + calculateTotalDeliveryCharges() + calculateTotalTax()
  }

  const loadAddresses = async () => {
    if (!currentUser) return
    try {
      const { userService } = await import('../lib/dbService')
      const profile = await userService.getProfile(currentUser.id)
      if (profile && profile.addresses) {
        setAddresses(profile.addresses)
        setSelectedAddress(profile.addresses.find(addr => addr.isDefault) || profile.addresses[0])
      } else {
        // Fallback to localStorage for migration
        const addressKey = `userAddresses-${currentUser.id}`
        const savedAddresses = JSON.parse(localStorage.getItem(addressKey) || '[]')
        setAddresses(savedAddresses)
        if (savedAddresses.length > 0) {
          setSelectedAddress(savedAddresses.find(addr => addr.isDefault) || savedAddresses[0])
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const loadServicedPincodes = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')
      
      const pincodeQuery = query(
        collection(db, 'serviceable_pincodes'),
        where('active', '==', true)
      )
      const pincodeSnap = await getDocs(pincodeQuery)
      const activePincodes = pincodeSnap.docs.map(doc => doc.data().pincode)
      setServicedPincodes(activePincodes)
    } catch (error) {
      console.error('Error loading serviceable pincodes:', error)
      // Fallback to default pincodes
      setServicedPincodes(['500034', '500033', '500081'])
    }
  }

  const addAddress = async () => {
    if (!newAddress.flatNo || !newAddress.streetName || !newAddress.city || !newAddress.pincode) {
      alert('Please fill all required fields (marked with *)')
      return
    }
    
    try {
      // Construct full address from components
      const fullAddress = [
        newAddress.flatNo,
        newAddress.buildingName,
        newAddress.streetName,
        newAddress.locality,
        newAddress.landmark && `Near ${newAddress.landmark}`,
        newAddress.city,
        newAddress.pincode
      ].filter(Boolean).join(', ')

      const addressData = { ...newAddress, address: fullAddress }
      const { userService } = await import('../lib/dbService')
      const savedAddress = await userService.addAddress(currentUser.id, addressData)
      
      const updatedAddresses = [...addresses, savedAddress]
      setAddresses(updatedAddresses)
      setSelectedAddress(savedAddress)
      setShowAddressForm(false)
      setNewAddress({
        type: 'Home',
        flatNo: '',
        buildingName: '',
        streetName: '',
        locality: '',
        landmark: '',
        city: 'Hyderabad',
        pincode: '',
        isDefault: false,
        location: null
      })
    } catch (error) {
      console.error('Error adding address:', error)
      alert('Error saving address. Please try again.')
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setNewAddress(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }))
        alert('Location added successfully!')
      })
    }
  }



  const checkPincodeService = () => {
    if (!selectedAddress) return false
    return servicedPincodes.includes(selectedAddress.pincode)
  }

  const proceedToPayment = () => {
    if (!checkPincodeService()) {
      alert('Sorry, your pincode is not currently served.')
      return
    }
    setStep('payment')
  }

  const sendVendorNotifications = async (orderResults, orderData) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')
      
      for (const orderId of orderResults.vendorOrderIds) {
        const orderDoc = await getDoc(doc(db, 'orders', orderId))
        if (orderDoc.exists()) {
          const order = orderDoc.data()
          
          // Get vendor phone number
          const vendorDoc = await getDoc(doc(db, 'vendors', order.vendorId))
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data()
            if (vendorData.phone) {
              await sendVendorNotificationSMS(vendorData.phone, {
                orderId: orderId,
                total: order.total,
                items: order.items,
                customerPhone: currentUser.phone
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending vendor notifications:', error)
    }
  }

  const timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM', 
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM'
  ]

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
        padding: window.innerWidth > 768 ? '30px' : '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Progress Indicator */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            {['address', 'payment'].map((s, i) => (
              <div key={s} style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: step === s ? '#16a34a' : i < ['address', 'payment'].indexOf(step) ? '#16a34a' : '#e5e7eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                {i + 1}
              </div>
            ))}
          </div>
          <div style={{ height: '2px', backgroundColor: '#e5e7eb', position: 'relative' }}>
            <div style={{
              height: '100%',
              backgroundColor: '#16a34a',
              width: `${(['address', 'payment'].indexOf(step) + 1) * 50}%`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        {/* Address Step */}
        {step === 'address' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Delivery Address</h2>
            
            {addresses.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Select Address:</h3>
                {addresses.map(addr => (
                  <div key={addr.id} style={{
                    border: selectedAddress?.id === addr.id ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }} onClick={() => setSelectedAddress(addr)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <strong>{addr.type}</strong>
                        {addr.isDefault && <span style={{ color: '#16a34a', fontSize: '12px', marginLeft: '8px' }}>(Default)</span>}
                        <p style={{ margin: '5px 0', color: '#666' }}>{addr.address}</p>
                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{addr.city} - {addr.pincode}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              {showAddressForm ? 'Cancel' : 'Add New Address'}
            </button>

            {showAddressForm && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Address Type:</label>
                  <select
                    value={newAddress.type}
                    onChange={(e) => setNewAddress({...newAddress, type: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Search Area/Locality:</label>
                  <GooglePlacesAutocomplete
                    placeholder="Start typing area name..."
                    value={newAddress.locality}
                    onPlaceSelect={(addressData) => {
                      setNewAddress({
                        ...newAddress,
                        locality: addressData.locality || addressData.city,
                        city: addressData.city || newAddress.city,
                        pincode: addressData.postal_code || newAddress.pincode,
                        location: {
                          lat: addressData.lat,
                          lng: addressData.lng
                        }
                      })
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Flat/House No *:</label>
                    <input
                      type="text"
                      placeholder="e.g., 4B, 201"
                      value={newAddress.flatNo}
                      onChange={(e) => setNewAddress({...newAddress, flatNo: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Building/Block:</label>
                    <input
                      type="text"
                      placeholder="e.g., Tower A, Block 5"
                      value={newAddress.buildingName}
                      onChange={(e) => setNewAddress({...newAddress, buildingName: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Street Name *:</label>
                  <input
                    type="text"
                    placeholder="e.g., MG Road, 1st Main Street"
                    value={newAddress.streetName}
                    onChange={(e) => setNewAddress({...newAddress, streetName: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Landmark:</label>
                  <input
                    type="text"
                    placeholder="Near Metro, Mall, etc."
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>City *:</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>PIN *:</label>
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <button
                    onClick={() => setShowMapPicker(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📍 Select Location on Map
                  </button>
                  {newAddress.location?.lat && (
                    <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '8px', margin: '8px 0 0 0' }}>
                      ✓ Location selected: {newAddress.location.address?.substring(0, 40)}...
                    </p>
                  )}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  Set as default address
                </label>

                <button
                  onClick={addAddress}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Save Address
                </button>
              </div>
            )}

            <div className="checkout-buttons" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onCancel} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => selectedAddress ? setStep('payment') : alert('Please select an address')}
                disabled={!selectedAddress}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedAddress ? '#16a34a' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedAddress ? 'pointer' : 'not-allowed'
                }}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}



        {/* Payment Step */}
        {step === 'payment' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Order Summary & Payment</h2>
            
            {/* Delivery Address */}
            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>Delivery Address</h4>
              <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
                {selectedAddress?.address}<br/>
                {selectedAddress?.city} - {selectedAddress?.pincode}
              </p>
            </div>
            
            {/* Vendor-wise Order Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Order Details</h4>
              {Object.keys(vendorGroups).map(vendorId => {
                const vendor = vendorGroups[vendorId]
                const selectedOption = deliveryOptions[vendorId] || 'delivery'
                let deliveryCharge = 0
                let deliveryLabel = 'Store Pickup'
                
                if (selectedOption === 'delivery') {
                  deliveryCharge = vendor.total >= 500 ? 0 : 35
                  deliveryLabel = 'Home Delivery'
                } else if (selectedOption === 'express') {
                  deliveryCharge = vendor.total >= 1000 ? 0 : 75
                  deliveryLabel = 'Express Delivery'
                }
                
                const vendorTax = Math.round(vendor.total * 0.05)
                const vendorTotal = vendor.total + deliveryCharge + vendorTax
                
                return (
                  <div key={vendorId} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '15px', 
                    marginBottom: '15px',
                    backgroundColor: '#fafafa'
                  }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>
                      {vendor.vendorName}
                    </h5>
                    
                    {/* Items */}
                    <div style={{ marginBottom: '10px' }}>
                      {vendor.items.map(item => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '13px', 
                          marginBottom: '3px',
                          color: '#6b7280'
                        }}>
                          <span>{item.name} × {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Vendor Summary */}
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#6b7280' }}>Items Subtotal:</span>
                        <span style={{ color: '#374151' }}>₹{vendor.total}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#6b7280' }}>{deliveryLabel}:</span>
                        <span style={{ color: deliveryCharge === 0 ? '#10b981' : '#f59e0b' }}>
                          {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#6b7280' }}>Tax (5%):</span>
                        <span style={{ color: '#374151' }}>₹{vendorTax}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', borderTop: '1px solid #e5e7eb', paddingTop: '5px', marginTop: '5px' }}>
                        <span style={{ color: '#374151' }}>Vendor Total:</span>
                        <span style={{ color: '#16a34a' }}>₹{vendorTotal}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Final Invoice */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '2px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>Final Invoice</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Items Total:</span>
                <span style={{ color: '#374151', fontWeight: '500' }}>₹{cartTotal}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Total Delivery Charges:</span>
                <span style={{ color: '#374151', fontWeight: '500' }}>
                  {calculateTotalDeliveryCharges() === 0 ? 'FREE' : `₹${calculateTotalDeliveryCharges()}`}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Total Tax (5%):</span>
                <span style={{ color: '#374151', fontWeight: '500' }}>₹{calculateTotalTax()}</span>
              </div>
              
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '2px solid #e5e7eb' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700' }}>
                <span style={{ color: '#374151' }}>Grand Total:</span>
                <span style={{ color: '#16a34a' }}>₹{calculateGrandTotal()}</span>
              </div>
            </div>
            
            {/* Time Slot Selection */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Preferred Time Slot:</h4>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="">Select time slot</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            {/* Payment Methods */}
            <PaymentMethods
              orderData={{
                amount: calculateGrandTotal(),
                customerId: currentUser.id,
                customerName: currentUser.name || currentUser.email,
                customerEmail: currentUser.email,
                customerPhone: currentUser.phone
              }}
              onPaymentSuccess={async (paymentResult) => {
                try {
                  const { orderService, analyticsService } = await import('../lib/dbService')
                  
                  // Prepare vendor groups with delivery charges
                  const processedVendorGroups = Object.keys(vendorGroups).map(vendorId => {
                    const vendorGroup = vendorGroups[vendorId]
                    const selectedOption = deliveryOptions[vendorId] || 'delivery'
                    
                    let deliveryCharge = 0
                    if (selectedOption === 'delivery') {
                      deliveryCharge = vendorGroup.total >= 500 ? 0 : 35
                    } else if (selectedOption === 'express') {
                      deliveryCharge = vendorGroup.total >= 1000 ? 0 : 75
                    }
                    
                    return {
                      vendorId,
                      vendorName: vendorGroup.vendorName,
                      items: vendorGroup.items,
                      subtotal: vendorGroup.total,
                      deliveryCharge,
                      tax: Math.round(vendorGroup.total * 0.05),
                      total: vendorGroup.total + deliveryCharge + Math.round(vendorGroup.total * 0.05),
                      deliveryOption: selectedOption
                    }
                  })
                  
                  console.log('Creating order with customer ID:', currentUser.id)
                  console.log('Current user object:', currentUser)
                  
                  const orderData = {
                    customerId: currentUser.id,
                    customerName: currentUser.name || currentUser.phone || 'Customer',
                    customerPhone: currentUser.phone || '',
                    totalAmount: processedVendorGroups.reduce((sum, group) => sum + group.total, 0),
                    deliveryAddress: selectedAddress,
                    email: currentUser.email || '',
                    timeSlot,
                    vendorGroups: processedVendorGroups,
                    paymentDetails: paymentResult
                  }
                  
                  const orderResults = await orderService.createOrder(orderData)
                  
                  // Save payment details
                  await paymentService.savePaymentDetails({
                    paymentId: paymentResult.paymentId,
                    orderId: orderResults.parentOrderId,
                    customerId: currentUser.id,
                    amount: calculateGrandTotal(),
                    method: paymentResult.method,
                    status: paymentResult.status || 'completed'
                  })
                  
                  // Track analytics
                  await analyticsService.trackEvent('order_completed', currentUser.id, {
                    parentOrderId: orderResults.parentOrderId,
                    totalAmount: orderData.totalAmount,
                    vendorCount: processedVendorGroups.length,
                    itemCount: processedVendorGroups.reduce((sum, group) => sum + group.items.length, 0),
                    paymentMethod: paymentResult.method
                  })
                  
                  // Send vendor notifications
                  await sendVendorNotifications(orderResults, orderData)
                  
                  onComplete(orderData)
                  window.location.href = `/customer/order-confirmation?parentOrderId=${orderResults.parentOrderId}&orderIds=${orderResults.vendorOrderIds.join(',')}`
                } catch (error) {
                  console.error('Error creating orders:', error)
                  
                  // Log error
                  const { analyticsService } = await import('../lib/dbService')
                  await analyticsService.logError('order_creation_failed', currentUser.id, error, {
                    vendorCount: Object.keys(vendorGroups).length,
                    totalAmount: cartTotal + calculateTotalDeliveryCharges(),
                    paymentMethod: paymentResult.method
                  })
                  
                  alert('Error placing orders. Please try again.')
                }
              }}
              onPaymentFailure={(error) => {
                console.error('Payment failed:', error)
                alert(`Payment failed: ${error}`)
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setStep('address')} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
                Back to Address
              </button>
            </div>
          </div>
        )}
        
        {/* Google Map Location Picker Modal */}
        {showMapPicker && (
          <GoogleMapLocationPicker
            onLocationSelect={(locationData) => {
              setNewAddress({
                ...newAddress,
                location: {
                  lat: locationData.lat,
                  lng: locationData.lng,
                  address: locationData.address
                }
              })
            }}
            addressDetails={newAddress}
            onClose={() => setShowMapPicker(false)}
          />
        )}
      </div>
    </div>
  )
}