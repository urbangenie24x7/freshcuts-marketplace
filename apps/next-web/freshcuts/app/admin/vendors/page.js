'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminVendors() {
  const [mounted, setMounted] = useState(false)
  const [vendors, setVendors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', area: '', lat: '', lng: '', categories: [], status: 'active', available: true, verified: false, rating: 4.0 })
  const [availableCategories, setAvailableCategories] = useState(['chicken', 'mutton', 'fish', 'seafood', 'pork', 'beef'])

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      setVendors(vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      // Load all categories from admin-maintained categoryCards (including inactive ones)
      const categoriesSnap = await getDocs(collection(db, 'categoryCards'))
      const categories = categoriesSnap.docs.map(doc => doc.data().name)
      if (categories.length > 0) {
        setAvailableCategories(categories)
      }
    } catch (error) {
      console.error('Error loading vendors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const vendorData = {
        ...formData,
        role: 'vendor',
        location: {
          address: formData.address,
          area: formData.area,
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0
        },
        updatedAt: new Date()
      }
      delete vendorData.address
      delete vendorData.area
      delete vendorData.lat
      delete vendorData.lng

      if (editingVendor) {
        await updateDoc(doc(db, 'vendors', editingVendor.id), vendorData)
      } else {
        await addDoc(collection(db, 'vendors'), { ...vendorData, createdAt: new Date() })
      }
      
      setShowForm(false)
      setEditingVendor(null)
      setFormData({ name: '', phone: '', address: '', area: '', lat: '', lng: '', categories: [], status: 'active', available: true, verified: false, rating: 4.0 })
      loadVendors()
    } catch (error) {
      console.error('Error saving vendor:', error)
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || '',
      phone: vendor.phone || '',
      address: vendor.location?.address || vendor.address || '',
      area: vendor.location?.area || '',
      lat: vendor.location?.lat || '',
      lng: vendor.location?.lng || '',
      categories: vendor.categories || [],
      status: vendor.status || 'active',
      available: vendor.available !== undefined ? vendor.available : true,
      verified: vendor.verified !== undefined ? vendor.verified : false,
      rating: vendor.rating || 4.0
    })
    setShowForm(true)
  }

  const handleDelete = async (vendorId) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    try {
      const { deleteDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      await deleteDoc(doc(db, 'vendors', vendorId))
      loadVendors()
    } catch (error) {
      console.error('Error deleting vendor:', error)
    }
  }

  const toggleVendorStatus = async (vendorId, currentStatus) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      await updateDoc(doc(db, 'vendors', vendorId), {
        available: !currentStatus,
        updatedAt: new Date()
      })
      loadVendors()
    } catch (error) {
      console.error('Error updating vendor status:', error)
    }
  }

  const formatCSVField = (value) => {
    const str = String(value || '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const downloadVendorsExcel = () => {
    // Sheet 1: Vendor Information
    const vendorData = vendors.map(vendor => ({
      VendorID: vendor.id,
      Name: vendor.name || '',
      Phone: vendor.phone || '',
      Address: vendor.location?.address || vendor.address || '',
      Area: vendor.location?.area || '',
      Latitude: vendor.location?.lat || '',
      Longitude: vendor.location?.lng || '',
      Available: vendor.available ? 'Yes' : 'No',
      Verified: vendor.verified ? 'Yes' : 'No',
      Rating: vendor.rating || '',
      Status: vendor.status || 'active'
    }))
    
    // Sheet 2: Category Assignments
    const categoryData = []
    vendors.forEach(vendor => {
      if (vendor.categories && vendor.categories.length > 0) {
        vendor.categories.forEach(category => {
          categoryData.push({
            VendorID: vendor.id,
            VendorName: vendor.name || '',
            Category: category
          })
        })
      }
    })
    
    // Create CSV for vendor info with proper quoting
    const vendorHeaders = Object.keys(vendorData[0]).join(',')
    const vendorRows = vendorData.map(row => Object.values(row).map(formatCSVField).join(','))
    const vendorCsv = [vendorHeaders, ...vendorRows].join('\n')
    const vendorBlob = new Blob([vendorCsv], { type: 'text/csv' })
    const vendorUrl = URL.createObjectURL(vendorBlob)
    const vendorLink = document.createElement('a')
    vendorLink.href = vendorUrl
    vendorLink.download = 'vendor_information.csv'
    vendorLink.click()
    URL.revokeObjectURL(vendorUrl)
    
    // Create CSV for categories with proper quoting
    if (categoryData.length > 0) {
      const categoryHeaders = Object.keys(categoryData[0]).join(',')
      const categoryRows = categoryData.map(row => Object.values(row).map(formatCSVField).join(','))
      const categoryCsv = [categoryHeaders, ...categoryRows].join('\n')
      const categoryBlob = new Blob([categoryCsv], { type: 'text/csv' })
      const categoryUrl = URL.createObjectURL(categoryBlob)
      const categoryLink = document.createElement('a')
      categoryLink.href = categoryUrl
      categoryLink.download = 'vendor_categories.csv'
      categoryLink.click()
      URL.revokeObjectURL(categoryUrl)
    }
    
    alert('Downloaded 2 files: vendor_information.csv and vendor_categories.csv')
  }

  const parseCSVLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  const handleCategoryUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      const { updateDoc, doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      const vendorCategories = {}
      
      // Group categories by vendor ID
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length < 3) continue
        
        const vendorId = values[0]?.trim()
        const category = values[2]?.trim()
        
        if (vendorId && category) {
          if (!vendorCategories[vendorId]) {
            vendorCategories[vendorId] = []
          }
          if (!vendorCategories[vendorId].includes(category)) {
            vendorCategories[vendorId].push(category)
          }
        }
      }
      
      let updated = 0
      
      // Update each vendor with their categories
      for (const [vendorId, categories] of Object.entries(vendorCategories)) {
        const vendorRef = doc(db, 'vendors', vendorId)
        const vendorSnap = await getDoc(vendorRef)
        
        if (vendorSnap.exists()) {
          await updateDoc(vendorRef, {
            categories: categories,
            updatedAt: new Date()
          })
          updated++
        }
      }
      
      loadVendors()
      alert(`Updated categories for ${updated} vendors`)
    } catch (error) {
      console.error('Error uploading categories:', error)
      alert('Error uploading categories: ' + error.message)
    }
    
    event.target.value = ''
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      const { collection, addDoc, updateDoc, doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      let data = []
      
      if (file.name.endsWith('.csv')) {
        // Handle CSV files
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        data = lines.slice(1).map(line => parseCSVLine(line))
      } else {
        // For Excel files, ask user to save as CSV first
        alert('Please save your Excel file as CSV format and upload again')
        return
      }
      
      let added = 0
      let updated = 0
      
      for (const values of data) {
        if (!values || values.length < 4) continue
        
        const vendorId = values[0]?.toString().trim()
        const vendorData = {
          name: values[1] || '',
          phone: values[2] || '',
          role: 'vendor',
          location: {
            address: values[3] || '',
            area: values[4] || '',
            lat: parseFloat(values[5]) || 0,
            lng: parseFloat(values[6]) || 0
          },
          available: values[7]?.toString().toLowerCase() === 'yes',
          verified: values[8]?.toString().toLowerCase() === 'yes',
          rating: parseFloat(values[9]) || 4.0,
          status: values[10] || 'active',
          updatedAt: new Date()
        }
        
        if (vendorId) {
          const vendorRef = doc(db, 'vendors', vendorId)
          const vendorSnap = await getDoc(vendorRef)
          
          if (vendorSnap.exists()) {
            const existingData = vendorSnap.data()
            await updateDoc(vendorRef, {
              ...vendorData,
              categories: existingData.categories || []
            })
            updated++
          } else {
            await updateDoc(vendorRef, {
              ...vendorData,
              categories: [],
              createdAt: new Date()
            })
            added++
          }
        } else {
          await addDoc(collection(db, 'vendors'), {
            ...vendorData,
            categories: [],
            createdAt: new Date()
          })
          added++
        }
      }
      
      loadVendors()
      alert(`Upload complete! Added: ${added}, Updated: ${updated} vendors`)
    } catch (error) {
      console.error('Error uploading vendors:', error)
      alert('Error uploading vendors: ' + error.message)
    }
    
    event.target.value = ''
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>Vendor Management</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={downloadVendorsExcel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Download Excel
            </button>
            <label style={{
              padding: '10px 20px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Upload Vendors
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <label style={{
              padding: '10px 20px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Upload Categories
              <input
                type="file"
                accept=".csv"
                onChange={handleCategoryUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Vendor
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input
                type="text"
                placeholder="Vendor Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <textarea
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px', minHeight: '80px' }}
              />
              <input
                type="text"
                placeholder="Area/Locality"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Latitude"
                  value={formData.lat}
                  onChange={(e) => setFormData({...formData, lat: e.target.value})}
                  step="any"
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  value={formData.lng}
                  onChange={(e) => setFormData({...formData, lng: e.target.value})}
                  step="any"
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Categories:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {availableCategories.map(category => (
                    <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, categories: [...formData.categories, category]})
                          } else {
                            setFormData({...formData, categories: formData.categories.filter(c => c !== category)})
                          }
                        }}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                  /> Available
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                  /> Verified
                </label>
                <input
                  type="number"
                  placeholder="Rating"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                  min="1" max="5" step="0.1"
                  style={{ padding: '5px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {editingVendor ? 'Update' : 'Add'} Vendor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingVendor(null)
                    setFormData({ name: '', phone: '', address: '', area: '', lat: '', lng: '', categories: [], status: 'active', available: true, verified: false, rating: 4.0 })
                  }}
                  style={{ padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {vendors.map(vendor => (
            <div key={vendor.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <h3 style={{ margin: '0', color: '#1f2937' }}>{vendor.name}</h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: vendor.status === 'active' ? '#dcfce7' : vendor.status === 'pending' ? '#fef3c7' : '#fee2e2',
                  color: vendor.status === 'active' ? '#166534' : vendor.status === 'pending' ? '#92400e' : '#991b1b'
                }}>
                  {vendor.status || 'active'}
                </span>
              </div>
              <p style={{ margin: '5px 0', color: '#6b7280' }}>Phone: {vendor.phone}</p>
              <p style={{ margin: '5px 0', color: '#6b7280' }}>Address: {vendor.location?.address || vendor.address}</p>
              {vendor.location?.area && <p style={{ margin: '5px 0', color: '#6b7280' }}>Area: {vendor.location.area}</p>}
              {(vendor.location?.lat && vendor.location?.lng) && (
                <p style={{ margin: '5px 0', color: '#6b7280' }}>Location: {vendor.location.lat.toFixed(4)}, {vendor.location.lng.toFixed(4)}</p>
              )}
              <p style={{ margin: '5px 0', color: '#6b7280' }}>Categories: {vendor.categories?.join(', ')}</p>
              <div style={{ display: 'flex', gap: '10px', margin: '5px 0' }}>
                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '10px', backgroundColor: vendor.available ? '#dcfce7' : '#fee2e2', color: vendor.available ? '#166534' : '#991b1b' }}>
                  {vendor.available ? 'Available' : 'Unavailable'}
                </span>
                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '10px', backgroundColor: vendor.verified ? '#dbeafe' : '#fef3c7', color: vendor.verified ? '#1e40af' : '#92400e' }}>
                  {vendor.verified ? 'Verified' : 'Unverified'}
                </span>
                <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '10px', backgroundColor: '#f3f4f6', color: '#374151' }}>
                  ⭐ {vendor.rating || 4.0}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={() => toggleVendorStatus(vendor.id, vendor.available)}
                  style={{ padding: '5px 10px', backgroundColor: vendor.available ? '#f59e0b' : '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  {vendor.available ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleEdit(vendor)}
                  style={{ padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  style={{ padding: '5px 10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}