import { useState, useEffect } from 'react'

export default function CheckDatabase() {
  const [vendors, setVendors] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')

      // Load vendors
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      const vendorsList = vendorsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
      setVendors(vendorsList)

      // Load users
      const usersSnap = await getDocs(collection(db, 'users'))
      const usersList = usersSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
      setUsers(usersList)

    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Database Check</h1>
      
      <h2>Vendors ({vendors.length})</h2>
      {vendors.length === 0 ? (
        <p>No vendors found</p>
      ) : (
        <table border="1" style={{ width: '100%', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => (
              <tr key={vendor.id}>
                <td>{vendor.id}</td>
                <td>{vendor.name || vendor.businessProfile?.businessName}</td>
                <td style={{ backgroundColor: '#ffeb3b' }}>{vendor.phone}</td>
                <td>{vendor.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Users ({users.length})</h2>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <table border="1" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td style={{ backgroundColor: '#ffeb3b' }}>{user.phone}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Phone Format Test</h2>
      <p>Login was searching for: <strong style={{ color: 'red' }}>+919876543219</strong></p>
      <p>Check if any phone numbers above match this format exactly.</p>
      
      <button onClick={loadData} style={{ padding: '10px 20px', marginTop: '20px' }}>
        Refresh Data
      </button>
    </div>
  )
}