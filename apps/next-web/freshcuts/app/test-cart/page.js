'use client'

import { useCart } from '../../lib/CartContext'
import Navigation from '../../components/Navigation'

export default function TestCartPage() {
  const { cart, addToCart, getCartCount, getCartTotal } = useCart()

  const testAddToCart = () => {
    const testItem = {
      id: 'test-product-1',
      productId: 'test-product-1',
      name: 'Test Chicken',
      price: 200,
      image: null,
      variant: null,
      quantity: 1,
      vendorId: 'test-vendor',
      vendorName: 'Test Vendor'
    }
    addToCart(testItem)
    alert('Test item added to cart!')
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Cart Test Page</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={testAddToCart}
            style={{
              padding: '10px 20px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Add Test Item to Cart
          </button>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2>Cart Status</h2>
          <p><strong>Cart Count:</strong> {getCartCount()}</p>
          <p><strong>Cart Total:</strong> ₹{getCartTotal()}</p>
          
          <h3>Cart Items:</h3>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <ul>
              {cart.map(item => (
                <li key={item.id}>
                  {item.name} - ₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}