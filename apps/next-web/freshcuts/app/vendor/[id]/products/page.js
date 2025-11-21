'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../../components/Navigation'
import { useCart } from '../../../../lib/CartContext'
import { VendorService, CompositeIdService } from '../../../../lib/masterService'

export default function VendorProductsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const category = searchParams.get('category')
  const highlightProductId = searchParams.get('product')

  useEffect(() => {
    loadVendorProducts()
  }, [params.id, category])

  useEffect(() => {
    if (highlightProductId && !loading && products.length > 0) {
      setTimeout(() => {
        const productElement = document.getElementById(`product-${highlightProductId}`)
        if (productElement) {
          productElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          productElement.classList.add('highlight-product')
          setTimeout(() => {
            productElement.classList.remove('highlight-product')
          }, 3000)
        }
      }, 500)
    }
  }, [highlightProductId, loading, products])

  const loadVendorProducts = async () => {
    try {
      console.log('Loading products for vendor:', params.id, 'category:', category)
      
      // Get vendor info
      const vendorData = await VendorService.getById(params.id)
      if (vendorData) {
        setVendor(vendorData)
      }
      
      // Get vendor products using the new system
      const vendorProducts = await CompositeIdService.getProductsByVendor(params.id)
      console.log('Vendor products from vendorProducts collection:', vendorProducts)
      
      // Filter by category if specified
      let filteredProducts = vendorProducts
      if (category) {
        filteredProducts = vendorProducts.filter(product => {
          const productCategory = product.category || ''
          return productCategory.toLowerCase().includes(category.toLowerCase()) ||
                 category.toLowerCase().includes(productCategory.toLowerCase()) ||
                 productCategory === category
        })
        console.log('Filtered products for category:', category, filteredProducts)
      }
      
      setProducts(filteredProducts)
      setLoading(false)
    } catch (error) {
      console.error('Error loading vendor products:', error)
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.compositeId || product.id,
      productId: product.productId || product.id,
      name: product.productName || product.name,
      price: product.finalPrice || product.vendorPrice || product.price,
      image: product.imageUrl || product.image_url,
      quantity: 1,
      vendorId: product.vendorId,
      vendorName: vendor?.businessName || vendor?.name
    }
    addToCart(cartItem)
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {vendor && (
          <div style={{ marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h1 style={{ color: '#16a34a', fontSize: '28px', margin: '0 0 10px 0' }}>
              {vendor.businessName || vendor.name}
            </h1>
            {category && (
              <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
                Category: {category}
              </p>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '24px', color: '#374151', marginBottom: '10px' }}>No products found</h3>
            <p style={{ color: '#6b7280' }}>
              {category ? `No products found in "${category}" category for this vendor.` : 'This vendor has no available products at the moment.'}
            </p>
            <Link href="/customer/marketplace" style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Browse All Products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(product => (
            <div 
              key={product.id} 
              id={`product-${product.productId || product.id}`}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}>
              {(product.imageUrl || product.image_url) ? (
                <img src={product.imageUrl || product.image_url} alt={product.productName || product.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '200px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  🥩
                </div>
              )}
              
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  {product.productName || product.name}
                </h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  ₹{product.finalPrice || product.vendorPrice || product.price}
                </p>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </>
  )
}