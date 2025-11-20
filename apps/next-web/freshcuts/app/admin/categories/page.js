'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminCategories() {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', active: true, description: '', icon: '', image: '', marginPercentage: 15 })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      const categoriesSnap = await getDocs(collection(db, 'categoryCards'))
      setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleImageUpload = async (e) => {
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
      setFormData({...formData, image: imageUrl})
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      const categoryData = {
        ...formData,
        updatedAt: new Date()
      }

      if (editingCategory) {
        await updateDoc(doc(db, 'categoryCards', editingCategory.id), categoryData)
      } else {
        await addDoc(collection(db, 'categoryCards'), { ...categoryData, createdAt: new Date() })
      }
      
      setShowForm(false)
      setEditingCategory(null)
      setFormData({ name: '', active: true, description: '', icon: '', image: '', marginPercentage: 15 })
      loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      active: category.active !== false,
      description: category.description || '',
      icon: category.icon || '',
      image: category.image || '',
      marginPercentage: category.marginPercentage || 15
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const { deleteDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      await deleteDoc(doc(db, 'categoryCards', categoryId))
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
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
          <span>Categories</span>
        </nav>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>Category Management</h1>
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
            Add Category
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Icon (emoji or text)"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>Category Image</label>
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
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    style={{ flex: 1, padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                  />
                </div>
                {uploading && (
                  <div style={{ marginTop: '5px', color: '#3b82f6', fontSize: '12px' }}>Uploading image...</div>
                )}
                {formData.image && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={formData.image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>Image Preview</div>
                  </div>
                )}
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px', minHeight: '80px' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>Margin Percentage (%)</label>
                <input
                  type="number"
                  placeholder="Margin percentage (e.g., 15)"
                  value={formData.marginPercentage}
                  onChange={(e) => setFormData({...formData, marginPercentage: parseFloat(e.target.value) || 0})}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '100%' }}
                />
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>This margin will be added to vendor prices for customer pricing</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                Active category
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
                    setFormData({ name: '', active: true, description: '', icon: '', image: '', marginPercentage: 15 })
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
          {categories.map(category => (
            <div key={category.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {category.image ? (
                    <img src={category.image} alt={category.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : category.icon ? (
                    <span style={{ fontSize: '24px' }}>{category.icon}</span>
                  ) : null}
                  <h3 style={{ margin: '0', color: '#1f2937' }}>{category.name}</h3>
                </div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: category.active ? '#dcfce7' : '#fee2e2',
                  color: category.active ? '#166534' : '#991b1b'
                }}>
                  {category.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {category.description && <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '14px' }}>{category.description}</p>}
              <p style={{ margin: '5px 0', color: '#f59e0b', fontSize: '12px', fontWeight: '500' }}>Margin: {category.marginPercentage || 15}%</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={() => handleEdit(category)}
                  style={{ padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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