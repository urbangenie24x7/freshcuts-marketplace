import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function VendorDashboard() {
  const [currentUser, setCurrentUser] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [vendorProducts, setVendorProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [editingPrices, setEditingPrices] = useState({})
  const [deliverySettings, setDeliverySettings] = useState({
    pickup: { available: true, charges: 0 },
    delivery: { available: true, charges: 35, freeAbove: 500 },
    express: { available: false, charges: 75, freeAbove: 1000 }
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (!savedUser) {
      window.location.href = '/vendor/login'
      return
    }
    
    const user = JSON.parse(savedUser)
    if (user.role !== 'vendor') {
      window.location.href = '/vendor/login'
      return
    }
    
    setCurrentUser(user)
    setMounted(true)
    loadData(user.id)
  }, [])

  // Filter products when currentUser is loaded
  const [filteredProducts, setFilteredProducts] = useState([])
  useEffect(() => {
    if (currentUser && products.length > 0) {
      const vendorCategories = currentUser.categories || []
      const availableProducts = products.filter(product => 
        vendorCategories.includes(product.category)
      )
      setFilteredProducts(availableProducts)
    }
  }, [currentUser, products])

  const loadData = async (vendorId) => {
    try {
      const { orderService, inventoryService } = await import('../../lib/dbService')
      
      // Load all master products
      const productsSnap = await getDocs(collection(db, 'products'))
      const allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProducts(allProducts)
      
      // Load vendor products with enhanced inventory data
      const vendorProductsQuery = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendorId)
      )
      const vendorProductsSnap = await getDocs(vendorProductsQuery)
      const vendorProductsData = vendorProductsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        stockQuantity: doc.data().stockQuantity || 50,
        reservedQuantity: doc.data().reservedQuantity || 0,
        lowStockThreshold: doc.data().lowStockThreshold || 10
      }))
      setVendorProducts(vendorProductsData)
      
      // Load orders using new service
      const ordersData = await orderService.getOrdersByVendor(vendorId)
      setOrders(ordersData)
      
      // Load delivery settings
      const deliveryQuery = query(
        collection(db, 'vendorDeliverySettings'),
        where('vendorId', '==', vendorId)
      )
      const deliverySnap = await getDocs(deliveryQuery)
      if (deliverySnap.docs.length > 0) {
        setDeliverySettings(deliverySnap.docs[0].data().settings)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    window.location.href = '/vendor/login'
  }

  const toggleProduct = async (productId, isActive, price = 100) => {
    try {
      if (isActive) {
        // Deactivate - find and delete vendor product
        const vendorProduct = vendorProducts.find(vp => vp.productId === productId)
        if (vendorProduct) {
          await deleteDoc(doc(db, 'vendorProducts', vendorProduct.id))
        }
      } else {
        // Activate - create vendor product with enhanced inventory data
        await addDoc(collection(db, 'vendorProducts'), {
          vendorId: currentUser.id,
          productId: productId,
          price: parseFloat(price),
          available: true,
          stockQuantity: 50,
          reservedQuantity: 0,
          lowStockThreshold: 10,
          lastRestocked: new Date(),
          autoRestock: false,
          createdAt: new Date()
        })
      }
      // Reload data
      loadData(currentUser.id)
    } catch (error) {
      console.error('Error toggling product:', error)
    }
  }

  const updatePrice = async (vendorProductId, newPrice) => {
    try {
      await updateDoc(doc(db, 'vendorProducts', vendorProductId), {
        price: parseFloat(newPrice)
      })
      // Reload data
      loadData(currentUser.id)
    } catch (error) {
      console.error('Error updating price:', error)
    }
  }

  const selectAllCategory = async (category) => {
    try {
      const categoryProducts = products.filter(product => product.category === category)
      
      for (const product of categoryProducts) {
        const isActive = vendorProducts.some(vp => vp.productId === product.id && vp.available)
        if (!isActive) {
          await addDoc(collection(db, 'vendorProducts'), {
            vendorId: currentUser.id,
            productId: product.id,
            price: 100, // Default price
            available: true,
            stockQuantity: 50,
            createdAt: new Date()
          })
        }
      }
      // Reload data
      loadData(currentUser.id)
    } catch (error) {
      console.error('Error selecting all products:', error)
    }
  }

  const saveDeliverySettings = async () => {
    try {
      const deliveryQuery = query(
        collection(db, 'vendorDeliverySettings'),
        where('vendorId', '==', currentUser.id)
      )
      const deliverySnap = await getDocs(deliveryQuery)
      
      if (deliverySnap.docs.length > 0) {
        await updateDoc(doc(db, 'vendorDeliverySettings', deliverySnap.docs[0].id), {
          settings: deliverySettings,
          updatedAt: new Date()
        })
      } else {
        await addDoc(collection(db, 'vendorDeliverySettings'), {
          vendorId: currentUser.id,
          settings: deliverySettings,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      alert('Delivery settings saved successfully!')
    } catch (error) {
      console.error('Error saving delivery settings:', error)
      alert('Error saving delivery settings')
    }
  }

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#1f2937', margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>Vendor Dashboard</h1>
            <p style={{ color: '#6b7280', margin: '0', fontSize: '16px' }}>
              Welcome, {currentUser?.name || currentUser?.businessName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'overview' ? '#16a34a' : 'transparent',
              color: activeTab === 'overview' ? 'white' : '#6b7280'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'payments' ? '#16a34a' : 'transparent',
              color: activeTab === 'payments' ? 'white' : '#6b7280'
            }}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'reports' ? '#16a34a' : 'transparent',
              color: activeTab === 'reports' ? 'white' : '#6b7280'
            }}
          >
            Reports
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>Available Products</p>
                <p style={{ color: '#1f2937', fontSize: '24px', margin: '0', fontWeight: '700' }}>{filteredProducts.length}</p>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '4px 0 0 0' }}>From your categories</p>
              </div>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                🥩
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>Total Orders</p>
                <p style={{ color: '#1f2937', fontSize: '24px', margin: '0', fontWeight: '700' }}>{orders.length}</p>
              </div>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                📦
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>Active Products</p>
                <p style={{ color: '#1f2937', fontSize: '24px', margin: '0', fontWeight: '700' }}>{vendorProducts.filter(p => p.available).length}</p>
              </div>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                ✅
              </div>
            </div>
          </div>
        </div>

        {/* Business Profile */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 20px 0', fontWeight: '600' }}>Business Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Business Name</label>
              <input
                type="text"
                value={currentUser?.businessName || currentUser?.name || ''}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Phone</label>
              <input
                type="text"
                value={currentUser?.phone || ''}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Categories</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentUser?.categories?.map(category => (
                  <span key={category} style={{
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Management */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 20px 0', fontWeight: '600' }}>Delivery Management</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Pickup Option */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={deliverySettings.pickup.available}
                  onChange={(e) => setDeliverySettings({
                    ...deliverySettings,
                    pickup: { ...deliverySettings.pickup, available: e.target.checked }
                  })}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>🏪 Pickup from Shop</span>
              </div>
              <p style={{ color: '#16a34a', fontSize: '14px', fontWeight: '500', margin: '0' }}>Always FREE</p>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '4px 0 0 0' }}>Customers can collect orders from your shop</p>
            </div>

            {/* Home Delivery */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={deliverySettings.delivery.available}
                  onChange={(e) => setDeliverySettings({
                    ...deliverySettings,
                    delivery: { ...deliverySettings.delivery, available: e.target.checked }
                  })}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>🚚 Home Delivery</span>
              </div>
              {deliverySettings.delivery.available && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Charges (₹)</label>
                    <input
                      type="number"
                      value={deliverySettings.delivery.charges}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        delivery: { ...deliverySettings.delivery, charges: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Free above (₹)</label>
                    <input
                      type="number"
                      value={deliverySettings.delivery.freeAbove}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        delivery: { ...deliverySettings.delivery, freeAbove: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>Deliver to customer's address</p>
            </div>

            {/* Express Delivery */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={deliverySettings.express.available}
                  onChange={(e) => setDeliverySettings({
                    ...deliverySettings,
                    express: { ...deliverySettings.express, available: e.target.checked }
                  })}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>⚡ Express Delivery</span>
              </div>
              {deliverySettings.express.available && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Charges (₹)</label>
                    <input
                      type="number"
                      value={deliverySettings.express.charges}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        express: { ...deliverySettings.express, charges: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Free above (₹)</label>
                    <input
                      type="number"
                      value={deliverySettings.express.freeAbove}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        express: { ...deliverySettings.express, freeAbove: parseInt(e.target.value) || 0 }
                      })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>Fast delivery within 1 hour</p>
            </div>
          </div>
          
          <button
            onClick={saveDeliverySettings}
            style={{
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Save Delivery Settings
          </button>
        </div>

        {/* Product Selection */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 20px 0', fontWeight: '600' }}>Select Products to Sell</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px 0' }}>Choose from products in your categories</p>
          
          {filteredProducts.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0', textAlign: 'center', padding: '40px' }}>No products available in your categories</p>
          ) : (
            <div>
              {currentUser?.categories?.map(category => {
                const categoryProducts = filteredProducts.filter(product => product.category === category)
                if (categoryProducts.length === 0) return null
                
                return (
                  <div key={category} style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h4 style={{ 
                          color: '#1f2937', 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          margin: '0',
                          textTransform: 'capitalize'
                        }}>
                          {category}
                        </h4>
                        <span style={{
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {categoryProducts.length} products
                        </span>
                      </div>
                      <button
                        onClick={() => selectAllCategory(category)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: '1px solid #16a34a',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: 'white',
                          color: '#16a34a'
                        }}
                      >
                        Select All
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                      gap: '16px',
                      alignItems: 'start'
                    }}>
                      {categoryProducts.map(product => {
                        const vendorProduct = vendorProducts.find(vp => vp.productId === product.id)
                        const isActive = vendorProduct && vendorProduct.available
                        const currentPrice = vendorProduct?.price || 100
                        
                        return (
                          <div key={product.id} style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '280px',
                            minHeight: '280px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <img 
                                src={product.image_url || 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop'}
                                alt={product.name}
                                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{product.name}</h5>
                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>{product.description || 'Fresh quality product'}</p>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  backgroundColor: isActive ? '#dcfce7' : '#f3f4f6',
                                  color: isActive ? '#16a34a' : '#6b7280'
                                }}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '12px',
                              flex: 1,
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Your Price</label>
                                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: isActive ? 'white' : '#f9fafb' }}>
                                    <span style={{ padding: '8px 12px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>₹</span>
                                    <input
                                      type="text"
                                      value={editingPrices[product.id] !== undefined ? editingPrices[product.id] : currentPrice}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '')
                                        setEditingPrices(prev => ({ ...prev, [product.id]: value }))
                                      }}
                                      onBlur={(e) => {
                                        const value = e.target.value
                                        if (isActive && vendorProduct && value && value !== currentPrice.toString()) {
                                          updatePrice(vendorProduct.id, value)
                                        }
                                        setEditingPrices(prev => {
                                          const newState = { ...prev }
                                          delete newState[product.id]
                                          return newState
                                        })
                                      }}
                                      disabled={!isActive}
                                      placeholder="Enter price"
                                      style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '14px',
                                        backgroundColor: 'transparent'
                                      }}
                                    />
                                    <span style={{ padding: '8px 12px', fontSize: '12px', color: '#6b7280', borderLeft: '1px solid #e5e7eb' }}>/{product.baseUnit || 'nos'}</span>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => toggleProduct(product.id, isActive, currentPrice)}
                                  style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    backgroundColor: isActive ? '#dc2626' : '#16a34a',
                                    color: 'white',

                                    whiteSpace: 'nowrap',
                                    zIndex: 1,
                                    position: 'relative'
                                  }}
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                              
                              {isActive && (
                                <div style={{ 
                                  padding: '8px 12px', 
                                  backgroundColor: '#f0fdf4', 
                                  border: '1px solid #bbf7d0', 
                                  borderRadius: '6px',
                                  fontSize: '12px', 
                                  color: '#16a34a', 
                                  fontWeight: '500' 
                                }}>
                                  Customer sees: ₹{Math.round(currentPrice * 1.15)}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === 'payments' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                <h3 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 8px 0', fontWeight: '600' }}>Payment History</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px 0' }}>View earnings and reconciliation</p>
                <button
                  onClick={() => window.location.href = '/vendor/payments'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  View Payments
                </button>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
                <h3 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 8px 0', fontWeight: '600' }}>Claims & Disputes</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px 0' }}>File claims for no-shows, cancellations</p>
                <button
                  onClick={() => window.location.href = '/vendor/claims'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Manage Claims
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ color: '#1f2937', fontSize: '18px', margin: '0 0 8px 0', fontWeight: '600' }}>Business Reports</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px 0' }}>View revenue, sales, and performance analytics</p>
              <button
                onClick={() => window.location.href = '/vendor/reports'}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                View Reports
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}