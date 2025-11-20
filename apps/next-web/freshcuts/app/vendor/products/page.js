'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/Navigation'
import { getCurrentUser } from '../../../lib/auth'

export default function VendorProducts() {
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [products, setProducts] = useState([])
  const [vendorPrices, setVendorPrices] = useState({})
  const [categoryMargins, setCategoryMargins] = useState({})
  const [editingPrice, setEditingPrice] = useState(null)
  const [newPrice, setNewPrice] = useState('')
  const [expandedProducts, setExpandedProducts] = useState({})
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'vendor') {
      router.push('/vendor/login')
      return
    }
    setCurrentUser(user)
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      // Load category margins from categoryCards
      const categoryCardsSnap = await getDocs(collection(db, 'categoryCards'))
      const margins = {}
      categoryCardsSnap.docs.forEach(doc => {
        const data = doc.data()
        margins[data.name] = data.marginPercentage || 15
      })
      setCategoryMargins(margins)
      
      // Load products from vendor's categories
      const user = getCurrentUser()
      if (user.categories && user.categories.length > 0) {
        const productsSnap = await getDocs(collection(db, 'products'))
        const categoryProducts = productsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(product => user.categories.includes(product.category))
        
        setProducts(categoryProducts)
        
        // Load vendor prices
        const vendorPricesSnap = await getDocs(
          query(collection(db, 'vendorPrices'), where('vendorId', '==', user.id))
        )
        const pricesMap = {}
        vendorPricesSnap.docs.forEach(doc => {
          const data = doc.data()
          const key = data.variantId ? `${data.productId}_${data.variantId}` : data.productId
          pricesMap[key] = {
            id: doc.id,
            price: data.price,
            available: data.available,
            variantId: data.variantId
          }
        })
        setVendorPrices(pricesMap)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const calculateCustomerPrice = (vendorPrice, category) => {
    const margin = categoryMargins[category] || 15
    return vendorPrice * (1 + margin / 100)
  }

  const handlePriceUpdate = async (productId, variantId = null) => {
    try {
      const { collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const price = parseFloat(newPrice)
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price')
        return
      }
      
      const key = variantId ? `${productId}_${variantId}` : productId
      const priceData = {
        vendorId: currentUser.id,
        productId: productId,
        variantId: variantId,
        price: price,
        available: true,
        updatedAt: new Date()
      }
      
      if (vendorPrices[key]) {
        await updateDoc(doc(db, 'vendorPrices', vendorPrices[key].id), priceData)
      } else {
        priceData.createdAt = new Date()
        const docRef = await addDoc(collection(db, 'vendorPrices'), priceData)
        priceData.id = docRef.id
      }
      
      setVendorPrices({
        ...vendorPrices,
        [key]: {
          id: vendorPrices[key]?.id || priceData.id,
          price: price,
          available: true,
          variantId: variantId
        }
      })
      
      setEditingPrice(null)
      setNewPrice('')
      alert('Price updated successfully!')
    } catch (error) {
      console.error('Error updating price:', error)
      alert('Error updating price')
    }
  }

  const toggleAvailability = async (productId, variantId = null) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const key = variantId ? `${productId}_${variantId}` : productId
      if (!vendorPrices[key]) {
        alert('Please set a price first')
        return
      }
      
      const newAvailability = !vendorPrices[key].available
      await updateDoc(doc(db, 'vendorPrices', vendorPrices[key].id), {
        available: newAvailability,
        updatedAt: new Date()
      })
      
      setVendorPrices({
        ...vendorPrices,
        [key]: {
          ...vendorPrices[key],
          available: newAvailability
        }
      })
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Error updating availability')
    }
  }

  const downloadMyPrices = async () => {
    try {
      const csvData = []
      csvData.push(['Product Name', 'Category', 'Variant Name', 'My Price', 'Customer Price', 'Available', 'Category Margin %'])
      
      products.forEach(product => {
        const categoryMargin = categoryMargins[product.category] || 15
        
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach(variant => {
            const key = `${product.id}_${variant.id}`
            const vendorPrice = vendorPrices[key]
            const customerPrice = vendorPrice ? calculateCustomerPrice(vendorPrice.price, product.category) : 0
            
            csvData.push([
              product.name,
              product.category,
              variant.name,
              vendorPrice?.price || '',
              customerPrice ? customerPrice.toFixed(2) : '',
              vendorPrice?.available ? 'Yes' : 'No',
              categoryMargin
            ])
          })
        } else {
          const vendorPrice = vendorPrices[product.id]
          const customerPrice = vendorPrice ? calculateCustomerPrice(vendorPrice.price, product.category) : 0
          
          csvData.push([
            product.name,
            product.category,
            'Base Product',
            vendorPrice?.price || '',
            customerPrice ? customerPrice.toFixed(2) : '',
            vendorPrice?.available ? 'Yes' : 'No',
            categoryMargin
          ])
        }
      })
      
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-prices-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert(`Downloaded ${csvData.length - 1} price records`)
    } catch (error) {
      console.error('Error downloading prices:', error)
      alert('Error downloading prices')
    }
  }

  const handlePriceUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('File must have at least a header and one data row')
        return
      }
      
      const { collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      // Parse CSV with proper quote handling
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
      
      const dataLines = lines.slice(1)
      let updated = 0
      let errors = []
      
      for (const line of dataLines) {
        try {
          const [productName, category, variantName, myPrice, , available] = parseCSVLine(line)
          
          if (!myPrice || myPrice === '') continue
          
          const product = products.find(p => p.name === productName)
          if (!product) {
            errors.push(`Product not found: ${productName}`)
            continue
          }
          
          let variantId = null
          if (variantName && variantName !== 'Base Product' && product.variations) {
            const variant = product.variations.find(v => v.name === variantName)
            if (variant) variantId = variant.id
          }
          
          const price = parseFloat(myPrice)
          if (isNaN(price)) {
            errors.push(`Invalid price for ${productName}: ${myPrice}`)
            continue
          }
          
          // Check for existing price record in database
          const { query, where, getDocs: getDocsImport } = await import('firebase/firestore')
          const existingQuery = query(
            collection(db, 'vendorPrices'),
            where('vendorId', '==', currentUser.id),
            where('productId', '==', product.id),
            ...(variantId ? [where('variantId', '==', variantId)] : [where('variantId', '==', null)])
          )
          
          const existingSnap = await getDocsImport(existingQuery)
          const priceData = {
            vendorId: currentUser.id,
            productId: product.id,
            variantId: variantId,
            price: price,
            available: available?.toLowerCase() === 'yes',
            updatedAt: new Date()
          }
          
          if (existingSnap.docs.length > 0) {
            // Update existing record
            await updateDoc(doc(db, 'vendorPrices', existingSnap.docs[0].id), priceData)
          } else {
            // Create new record
            priceData.createdAt = new Date()
            await addDoc(collection(db, 'vendorPrices'), priceData)
          }
          
          updated++
        } catch (error) {
          errors.push(`Error processing line: ${line.substring(0, 50)}...`)
        }
      }
      
      // Reload data to refresh the UI
      await loadData()
      
      let message = `Updated ${updated} prices`
      if (errors.length > 0) {
        message += `\n\nErrors (${errors.length}):\n${errors.slice(0, 3).join('\n')}`
        if (errors.length > 3) message += `\n...and ${errors.length - 3} more`
      }
      
      alert(message)
      e.target.value = ''
    } catch (error) {
      console.error('Error uploading prices:', error)
      alert('Error uploading prices')
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>My Products & Pricing</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>
              Set your prices for products in your categories. Customer prices include category-specific margins.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={downloadMyPrices}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Download Prices
            </button>
            <label
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'inline-block'
              }}
            >
              Upload Prices
              <input
                type="file"
                accept=".csv"
                onChange={handlePriceUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {currentUser?.categories?.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              No categories assigned. Contact admin to assign product categories to your vendor account.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              No products found for your categories: {currentUser?.categories?.join(', ')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {products.map(product => {
              const categoryMargin = categoryMargins[product.category] || 15
              const hasVariants = product.variations && product.variations.length > 0
              const isExpanded = expandedProducts[product.id]
              
              return (
                <div key={product.id} style={{ 
                  backgroundColor: 'white', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {(product.image_url || product.image) && (
                    <img 
                      src={product.image_url || product.image} 
                      alt={product.name}
                      style={{ 
                        width: '100%', 
                        height: '150px', 
                        objectFit: 'cover', 
                        borderRadius: '6px',
                        marginBottom: '15px'
                      }}
                    />
                  )}
                  
                  <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>{product.name}</h3>
                  <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '14px' }}>
                    Category: {product.category}
                  </p>
                  <p style={{ margin: '0 0 15px 0', color: '#f59e0b', fontSize: '12px' }}>
                    Margin: {categoryMargin}%
                  </p>
                  
                  {hasVariants ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Variants ({product.variations.length})</span>
                        <button
                          onClick={() => setExpandedProducts({...expandedProducts, [product.id]: !isExpanded})}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#f3f4f6', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      
                      {isExpanded && product.variations.map(variant => {
                        const variantKey = `${product.id}_${variant.id}`
                        const vendorPrice = vendorPrices[variantKey]
                        const customerPrice = vendorPrice ? calculateCustomerPrice(vendorPrice.price, product.category) : 0
                        
                        return (
                          <div key={variant.id} style={{ 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '6px', 
                            padding: '15px', 
                            marginBottom: '10px',
                            backgroundColor: '#f9fafb'
                          }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1f2937' }}>{variant.name}</h4>
                            
                            {editingPrice === variantKey ? (
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                <input
                                  type="number"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  placeholder="Enter price"
                                  step="0.01"
                                  style={{ 
                                    flex: 1,
                                    padding: '8px', 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                  }}
                                />
                                <button
                                  onClick={() => handlePriceUpdate(product.id, variant.id)}
                                  style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#16a34a', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPrice(null)
                                    setNewPrice('')
                                  }}
                                  style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#6b7280', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Your Price:</span>
                                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                                    {vendorPrice ? `₹${vendorPrice.price}` : 'Not set'}
                                  </span>
                                </div>
                                {vendorPrice && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Customer Price:</span>
                                    <span style={{ fontSize: '14px', color: '#16a34a' }}>
                                      ₹{customerPrice.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    onClick={() => {
                                      setEditingPrice(variantKey)
                                      setNewPrice(vendorPrice?.price || '')
                                    }}
                                    style={{ 
                                      flex: 1,
                                      padding: '8px', 
                                      backgroundColor: '#3b82f6', 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    {vendorPrice ? 'Update' : 'Set Price'}
                                  </button>
                                  {vendorPrice && (
                                    <button
                                      onClick={() => toggleAvailability(product.id, variant.id)}
                                      style={{ 
                                        flex: 1,
                                        padding: '8px', 
                                        backgroundColor: vendorPrice.available ? '#f59e0b' : '#16a34a', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      {vendorPrice.available ? 'Unavailable' : 'Available'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '12px' }}>No variants - Single product pricing</p>
                      {(() => {
                        const vendorPrice = vendorPrices[product.id]
                        const customerPrice = vendorPrice ? calculateCustomerPrice(vendorPrice.price, product.category) : 0
                        
                        return editingPrice === product.id ? (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              placeholder="Enter price"
                              step="0.01"
                              style={{ 
                                flex: 1,
                                padding: '8px', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            />
                            <button
                              onClick={() => handlePriceUpdate(product.id)}
                              style={{ 
                                padding: '8px 12px', 
                                backgroundColor: '#16a34a', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingPrice(null)
                                setNewPrice('')
                              }}
                              style={{ 
                                padding: '8px 12px', 
                                backgroundColor: '#6b7280', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>Your Price:</span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                                {vendorPrice ? `₹${vendorPrice.price}` : 'Not set'}
                              </span>
                            </div>
                            {vendorPrice && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Customer Price:</span>
                                <span style={{ fontSize: '14px', color: '#16a34a' }}>
                                  ₹{customerPrice.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => {
                                  setEditingPrice(product.id)
                                  setNewPrice(vendorPrice?.price || '')
                                }}
                                style={{ 
                                  flex: 1,
                                  padding: '8px', 
                                  backgroundColor: '#3b82f6', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                {vendorPrice ? 'Update Price' : 'Set Price'}
                              </button>
                              {vendorPrice && (
                                <button
                                  onClick={() => toggleAvailability(product.id)}
                                  style={{ 
                                    flex: 1,
                                    padding: '8px', 
                                    backgroundColor: vendorPrice.available ? '#f59e0b' : '#16a34a', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                >
                                  {vendorPrice.available ? 'Mark Unavailable' : 'Mark Available'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })()
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}