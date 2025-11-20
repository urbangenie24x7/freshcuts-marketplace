'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../../components/Navigation'
import { getCurrentUser } from '../../lib/auth'

export default function VendorProducts() {
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [products, setProducts] = useState([])
  const [vendorPrices, setVendorPrices] = useState({})
  const [categoryMargins, setCategoryMargins] = useState({})
  const [editingPrice, setEditingPrice] = useState(null)
  const [newPrice, setNewPrice] = useState('')
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
      const { db } = await import('../../lib/firebase.client')
      
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
          pricesMap[data.productId] = {
            id: doc.id,
            price: data.price,
            available: data.available
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

  const handlePriceUpdate = async (productId) => {
    try {
      const { collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase.client')
      
      const price = parseFloat(newPrice)
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price')
        return
      }
      
      const priceData = {
        vendorId: currentUser.id,
        productId: productId,
        price: price,
        available: true,
        updatedAt: new Date()
      }
      
      if (vendorPrices[productId]) {
        await updateDoc(doc(db, 'vendorPrices', vendorPrices[productId].id), priceData)
      } else {
        priceData.createdAt = new Date()
        const docRef = await addDoc(collection(db, 'vendorPrices'), priceData)
        priceData.id = docRef.id
      }
      
      setVendorPrices({
        ...vendorPrices,
        [productId]: {
          id: vendorPrices[productId]?.id || priceData.id,
          price: price,
          available: true
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

  const toggleAvailability = async (productId) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase.client')
      
      if (!vendorPrices[productId]) {
        alert('Please set a price first')
        return
      }
      
      const newAvailability = !vendorPrices[productId].available
      await updateDoc(doc(db, 'vendorPrices', vendorPrices[productId].id), {
        available: newAvailability,
        updatedAt: new Date()
      })
      
      setVendorPrices({
        ...vendorPrices,
        [productId]: {
          ...vendorPrices[productId],
          available: newAvailability
        }
      })
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Error updating availability')
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>My Products & Pricing</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>
            Set your prices for products in your categories. Customer prices include category-specific margins.
          </p>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {products.map(product => {
              const vendorPrice = vendorPrices[product.id]
              const categoryMargin = categoryMargins[product.category] || 15
              const customerPrice = vendorPrice ? calculateCustomerPrice(vendorPrice.price, product.category) : 0
              
              return (
                <div key={product.id} style={{ 
                  backgroundColor: 'white', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {product.image && (
                    <img 
                      src={product.image} 
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
                  
                  {product.variants && product.variants.length > 0 && (
                    <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '12px' }}>
                      Variants: {product.variants.map(v => v.name).join(', ')}
                    </p>
                  )}
                  
                  <div style={{ marginBottom: '15px' }}>
                    {editingPrice === product.id ? (
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
                        <button
                          onClick={() => {
                            setEditingPrice(product.id)
                            setNewPrice(vendorPrice?.price || '')
                          }}
                          style={{ 
                            width: '100%',
                            padding: '8px', 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginBottom: '10px'
                          }}
                        >
                          {vendorPrice ? 'Update Price' : 'Set Price'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {vendorPrice && (
                    <button
                      onClick={() => toggleAvailability(product.id)}
                      style={{ 
                        width: '100%',
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
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}