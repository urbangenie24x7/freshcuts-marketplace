'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminProducts() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProductData, setEditingProductData] = useState(null)
  const [variantsExpanded, setVariantsExpanded] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    default_price: '', 
    available: true, 
    description: '', 
    image_url: '',
    baseUnit: 'kg',
    shelfLife: '',
    storageInstructions: '',
    searchKeywords: '',
    featured: false,
    variations: []
  })
  const [uploading, setUploading] = useState(false)
  const [categoryCards, setCategoryCards] = useState([])

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      const productsSnap = await getDocs(collection(db, 'products'))
      const categoryCardsSnap = await getDocs(collection(db, 'categoryCards'))
      setCategoryCards(categoryCardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      const mappedProducts = productsSnap.docs.map(doc => {
        const data = doc.data()
        const hasVariations = data.variations && data.variations.length > 0
        const firstVariation = hasVariations ? data.variations[0] : null
        
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          default_price: data.default_price,
          available: firstVariation ? firstVariation.available : true,
          description: data.description,
          image: data.image_url,
          stock_quantity: hasVariations ? data.variations.filter(v => v.available).length : 1,
          sku: data.searchKeywords || '',
          baseUnit: data.baseUnit,
          variations: data.variations || [],
          featured: data.featured,
          tags: data.tags || [],
          shelfLife: data.shelfLife,
          storageInstructions: data.storageInstructions,
          ...data
        }
      })
      
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const { uploadProductToCloudinary } = await import('../../../lib/cloudinary')
      const imageUrl = await uploadProductToCloudinary(file)
      setFormData({...formData, image_url: imageUrl})
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const addVariation = () => {
    const newVariation = {
      id: `var_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      weight: 0,
      unit: 'g',
      priceMultiplier: 1,
      preparation: 'cleaned',
      cut: 'regular',
      available: true,
      minOrderQty: 1,
      maxOrderQty: 10
    }
    setFormData({...formData, variations: [...formData.variations, newVariation]})
  }

  const removeVariation = (index) => {
    const newVariations = formData.variations.filter((_, i) => i !== index)
    setFormData({...formData, variations: newVariations})
  }

  const updateVariation = (index, field, value) => {
    const newVariations = [...formData.variations]
    newVariations[index] = { ...newVariations[index], [field]: value }
    setFormData({...formData, variations: newVariations})
  }

  const openEditModal = (product) => {
    setEditingProductData({
      ...product,
      variations: product.variations || []
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setEditingProductData(null)
    setShowEditModal(false)
  }

  const handleModalImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const { uploadProductToCloudinary } = await import('../../../lib/cloudinary')
      const imageUrl = await uploadProductToCloudinary(file)
      setEditingProductData({...editingProductData, image_url: imageUrl})
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const addModalVariant = () => {
    const newVariant = {
      id: `var_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      weight: 0,
      unit: 'g',
      priceMultiplier: 1,
      preparation: 'cleaned',
      cut: 'regular',
      available: true,
      minOrderQty: 1,
      maxOrderQty: 10
    }
    setEditingProductData({...editingProductData, variations: [...(editingProductData.variations || []), newVariant]})
  }

  const removeModalVariant = (index) => {
    const newVariations = editingProductData.variations.filter((_, i) => i !== index)
    setEditingProductData({...editingProductData, variations: newVariations})
  }

  const updateModalVariant = (index, field, value) => {
    const newVariations = [...editingProductData.variations]
    newVariations[index] = { ...newVariations[index], [field]: value }
    setEditingProductData({...editingProductData, variations: newVariations})
  }

  const saveProductChanges = async () => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      await updateDoc(doc(db, 'products', editingProductData.id), {
        name: editingProductData.name,
        default_price: editingProductData.default_price,
        category: editingProductData.category,
        description: editingProductData.description,
        image_url: editingProductData.image_url,
        baseUnit: editingProductData.baseUnit,
        shelfLife: editingProductData.shelfLife,
        storageInstructions: editingProductData.storageInstructions,
        searchKeywords: editingProductData.searchKeywords,
        available: editingProductData.available,
        featured: editingProductData.featured,
        variations: editingProductData.variations || [],
        updatedAt: new Date()
      })
      
      closeEditModal()
      loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const productData = {
        ...formData,
        default_price: parseFloat(formData.default_price),
        updatedAt: new Date()
      }

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData)
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: new Date() })
      }
      
      setShowForm(false)
      setEditingProduct(null)
      setFormData({ name: '', category: '', default_price: '', available: true, description: '', image_url: '', baseUnit: 'kg', shelfLife: '', storageInstructions: '', searchKeywords: '', featured: false, variations: [] })
      loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      default_price: product.default_price?.toString() || '',
      available: product.available !== false,
      description: product.description || '',
      image_url: product.image_url || '',
      baseUnit: product.baseUnit || 'kg',
      shelfLife: product.shelfLife || '',
      storageInstructions: product.storageInstructions || '',
      searchKeywords: product.searchKeywords || '',
      featured: product.featured || false,
      variations: product.variations || []
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const { deleteDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      await deleteDoc(doc(db, 'products', productId))
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleCopy = async (product) => {
    try {
      const { collection, addDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const copiedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      delete copiedProduct.id
      
      await addDoc(collection(db, 'products'), copiedProduct)
      loadProducts()
    } catch (error) {
      console.error('Error copying product:', error)
    }
  }

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
          <a href="/admin" style={{ color: '#16a34a', textDecoration: 'none' }}>Admin</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Products</span>
        </nav>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>Product Management</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '5px 0 0 0' }}>Manage products with images and inventory</p>
          </div>
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
            + Add Product
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
          >
            <option value="all">All Categories</option>
            {categoryCards.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{products.length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Products</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{products.filter(p => p.available).length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Available</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{products.filter(p => !p.available).length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Out of Stock</div>
          </div>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              >
                <option value="">Select Category</option>
                {categoryCards.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Price (₹)"
                value={formData.default_price}
                onChange={(e) => setFormData({...formData, default_price: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>Product Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ flex: 1, padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  />
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>or</span>
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    style={{ flex: 1, padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  />
                </div>
                {uploading && (
                  <div style={{ marginTop: '5px', color: '#3b82f6', fontSize: '12px' }}>Uploading image...</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <select
                  value={formData.baseUnit}
                  onChange={(e) => setFormData({...formData, baseUnit: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="piece">Piece</option>
                  <option value="pack">Pack</option>
                </select>
                <input
                  type="text"
                  placeholder="Search Keywords"
                  value={formData.searchKeywords}
                  onChange={(e) => setFormData({...formData, searchKeywords: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Shelf Life"
                  value={formData.shelfLife}
                  onChange={(e) => setFormData({...formData, shelfLife: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  placeholder="Storage Instructions"
                  value={formData.storageInstructions}
                  onChange={(e) => setFormData({...formData, storageInstructions: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                />
              </div>
              {formData.image_url && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <img src={formData.image_url} alt="Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>Image Preview</div>
                </div>
              )}
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px', minHeight: '80px' }}
              />
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                  />
                  Available for sale
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  />
                  Featured product
                </label>
              </div>

              {/* Variations Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: '500', color: '#374151' }}>Product Variations</label>
                  <button
                    type="button"
                    onClick={addVariation}
                    style={{ padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + Add Variation
                  </button>
                </div>
                {formData.variations.map((variation, index) => (
                  <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '15px', marginBottom: '10px', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Name (e.g., 500g)"
                        value={variation.name || ''}
                        onChange={(e) => updateVariation(index, 'name', e.target.value)}
                        style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <input
                        type="number"
                        placeholder="Weight"
                        value={variation.weight || ''}
                        onChange={(e) => updateVariation(index, 'weight', parseInt(e.target.value))}
                        style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price Multiplier"
                        value={variation.priceMultiplier || ''}
                        onChange={(e) => updateVariation(index, 'priceMultiplier', parseFloat(e.target.value))}
                        style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        style={{ padding: '8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <select
                        value={variation.unit || 'g'}
                        onChange={(e) => updateVariation(index, 'unit', e.target.value)}
                        style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                      >
                        <option value="g">Gram</option>
                        <option value="kg">Kilogram</option>
                        <option value="piece">Piece</option>
                      </select>
                      <select
                        value={variation.preparation || 'cleaned'}
                        onChange={(e) => updateVariation(index, 'preparation', e.target.value)}
                        style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                      >
                        <option value="cleaned">Cleaned</option>
                        <option value="cut">Cut</option>
                        <option value="whole">Whole</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={variation.available !== false}
                          onChange={(e) => updateVariation(index, 'available', e.target.checked)}
                        />
                        Available
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                    setFormData({ name: '', category: '', default_price: '', available: true, description: '', image_url: '', baseUnit: 'kg', shelfLife: '', storageInstructions: '', searchKeywords: '', featured: false, variations: [] })
                  }}
                  style={{ padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
            return matchesSearch && matchesCategory
          }).map(product => (
            <div key={product.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '100%', height: '180px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    No Image
                  </div>
                )}
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '5px' }}>
                  {product.featured && (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      backgroundColor: '#fbbf24',
                      color: '#92400e'
                    }}>
                      Featured
                    </span>
                  )}
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '500',
                    backgroundColor: product.available ? '#dcfce7' : '#fee2e2',
                    color: product.available ? '#166534' : '#991b1b'
                  }}>
                    {product.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>{product.name}</h3>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.category}</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>₹{product.default_price}/{product.baseUnit}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{product.variations?.length || 0} variants</div>
              </div>
              
              {product.variations && product.variations.length > 0 && (
                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6b7280' }}>
                  Sizes: {product.variations.map(v => v.name).join(', ')}
                </div>
              )}
              
              {product.shelfLife && (
                <div style={{ marginBottom: '5px', fontSize: '12px', color: '#6b7280' }}>
                  Shelf Life: {product.shelfLife}
                </div>
              )}
              
              {product.description && (
                <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.4' }}>
                  {product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description}
                </p>
              )}
              
              {product.storageInstructions && (
                <div style={{ marginBottom: '10px', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                  Storage: {product.storageInstructions}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                <button
                  onClick={() => openEditModal(product)}
                  style={{ padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleCopy(product)}
                  style={{ padding: '5px 10px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Copy
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{ padding: '5px 10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingProductData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#374151' }}>Edit Product</h2>
                <button
                  onClick={closeEditModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Product Image</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalImageUpload}
                      style={{ fontSize: '14px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', flex: 1 }}
                    />
                    {uploading && <span style={{ fontSize: '14px', color: '#16a34a' }}>Uploading...</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste image URL"
                    value={editingProductData.image_url || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, image_url: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                  {editingProductData.image_url && (
                    <img src={editingProductData.image_url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', marginTop: '10px' }} />
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Name</label>
                  <input
                    type="text"
                    value={editingProductData.name || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Category</label>
                  <select
                    value={editingProductData.category || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    {categoryCards.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Base Price (₹)</label>
                  <input
                    type="number"
                    value={editingProductData.default_price || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, default_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Base Unit</label>
                  <select
                    value={editingProductData.baseUnit || 'kg'}
                    onChange={(e) => setEditingProductData({ ...editingProductData, baseUnit: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="piece">Piece</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Search Keywords</label>
                  <input
                    type="text"
                    value={editingProductData.searchKeywords || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, searchKeywords: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Description</label>
                <textarea
                  value={editingProductData.description || ''}
                  onChange={(e) => setEditingProductData({ ...editingProductData, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Shelf Life</label>
                  <input
                    type="text"
                    value={editingProductData.shelfLife || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, shelfLife: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Storage Instructions</label>
                  <input
                    type="text"
                    value={editingProductData.storageInstructions || ''}
                    onChange={(e) => setEditingProductData({ ...editingProductData, storageInstructions: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editingProductData.available !== false}
                    onChange={(e) => setEditingProductData({ ...editingProductData, available: e.target.checked })}
                  />
                  Available for sale
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editingProductData.featured || false}
                    onChange={(e) => setEditingProductData({ ...editingProductData, featured: e.target.checked })}
                  />
                  Featured product
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div 
                  onClick={() => setVariantsExpanded(!variantsExpanded)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '15px',
                    cursor: 'pointer',
                    padding: '10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Product Variants ({(editingProductData.variations || []).length})</span>
                    <span style={{ fontSize: '12px', color: '#6b7280', transform: variantsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </div>
                  {variantsExpanded && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addModalVariant(); }}
                      style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      + Add
                    </button>
                  )}
                </div>
                {variantsExpanded && (
                  <div style={{ display: 'grid', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {(editingProductData.variations || []).map((variant, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 1fr 2fr 40px', gap: '10px', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <input
                          type="text"
                          placeholder="Variant Name"
                          value={variant.name || ''}
                          onChange={(e) => updateModalVariant(index, 'name', e.target.value)}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        />
                        <input
                          type="number"
                          placeholder="Weight"
                          value={variant.weight || ''}
                          onChange={(e) => updateModalVariant(index, 'weight', e.target.value)}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        />
                        <select
                          value={variant.unit || 'kg'}
                          onChange={(e) => updateModalVariant(index, 'unit', e.target.value)}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="piece">pc</option>
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Price Multiplier"
                          value={variant.priceMultiplier || ''}
                          onChange={(e) => updateModalVariant(index, 'priceMultiplier', parseFloat(e.target.value) || 1)}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        />
                        <input
                          type="text"
                          placeholder="Cut/Preparation"
                          value={variant.preparation || ''}
                          onChange={(e) => updateModalVariant(index, 'preparation', e.target.value)}
                          style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        />
                        <button
                          onClick={() => removeModalVariant(index)}
                          style={{ padding: '8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeEditModal}
                  style={{ padding: '12px 24px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProductChanges}
                  style={{ padding: '12px 24px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}