import { useState } from 'react'

export default function CreateVendor() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const createVendor = async () => {
    if (!phone || !name) {
      setMessage('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')

      const vendorData = {
        phone: phone.replace(/[^0-9]/g, '').slice(-10), // Store clean 10-digit number
        name: name,
        role: 'vendor',
        categories: ['chicken', 'mutton', 'fish'],
        status: 'active',
        businessProfile: {
          businessName: name,
          address: 'Local Area',
          description: 'Fresh meat vendor'
        },
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'vendors'), vendorData)
      setMessage(`✅ Vendor created successfully! ID: ${docRef.id}`)
      setPhone('')
      setName('')
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Create Test Vendor</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Phone Number:</label>
        <input
          type="text"
          placeholder="9876543219"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '5px 0' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Vendor Name:</label>
        <input
          type="text"
          placeholder="Fresh Meat Store"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '5px 0' }}
        />
      </div>

      <button
        onClick={createVendor}
        disabled={loading}
        style={{
          backgroundColor: '#16a34a',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating...' : 'Create Vendor'}
      </button>

      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: message.includes('✅') ? '#dcfce7' : '#fef2f2',
          borderRadius: '6px'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}