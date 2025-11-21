'use client'

import { createContext, useState, useEffect, useContext, createElement } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deliveryOptions, setDeliveryOptions] = useState({})

  const getCartKey = (userId) => userId ? `cart_${userId}` : 'cart_guest'

  const loadCart = (userId = null) => {
    if (typeof window === 'undefined') return []
    const cartKey = getCartKey(userId)
    const savedCart = localStorage.getItem(cartKey)
    return savedCart ? JSON.parse(savedCart) : []
  }

  const saveCart = (cartItems, userId = null) => {
    if (typeof window === 'undefined') return
    const cartKey = getCartKey(userId)
    localStorage.setItem(cartKey, JSON.stringify(cartItems))
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved user first
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser(user)
          // Load user-specific cart
          setCart(loadCart(user.id))
        } catch (error) {
          console.error('Error parsing saved user:', error)
          setCart(loadCart())
        }
      } else {
        // Load guest cart
        setCart(loadCart())
      }
    }
  }, [])

  // Handle user changes (login/logout)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleUserChange = () => {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
        const lastUserId = localStorage.getItem('lastUserId')
        
        if (user?.id !== lastUserId) {
          // User changed, migrate guest cart if needed
          if (user?.id && !lastUserId) {
            const guestCart = loadCart(null)
            const userCart = loadCart(user.id)
            
            if (guestCart.length > 0 && userCart.length === 0) {
              saveCart(guestCart, user.id)
              localStorage.removeItem('cart_guest')
            }
          }
          
          // Load appropriate cart
          setCurrentUser(user)
          setCart(loadCart(user?.id))
          localStorage.setItem('lastUserId', user?.id || '')
        }
      }
      
      // Check on storage changes
      window.addEventListener('storage', handleUserChange)
      return () => window.removeEventListener('storage', handleUserChange)
    }
  }, [])

  // Save cart whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && cart.length >= 0) {
      saveCart(cart, currentUser?.id)
    }
  }, [cart, currentUser?.id])

  const addToCart = (cartItem) => {
    console.log('Adding to cart:', cartItem)
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItem.id)
      if (existing) {
        const updated = prev.map(item => 
          item.id === cartItem.id 
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        )
        console.log('Updated cart:', updated)
        return updated
      }
      const newCart = [...prev, cartItem]
      console.log('New cart:', newCart)
      return newCart
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    
    setCart(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const updateDeliveryOption = (vendorId, option) => {
    setDeliveryOptions(prev => ({ ...prev, [vendorId]: option }))
  }

  const clearCart = () => {
    setCart([])
    setDeliveryOptions({})
    if (typeof window !== 'undefined') {
      const cartKey = getCartKey(currentUser?.id)
      localStorage.removeItem(cartKey)
    }
  }

  const updateUser = (user) => {
    setCurrentUser(user)
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
      } else {
        localStorage.removeItem('currentUser')
      }
    }
  }

  return createElement(CartContext.Provider, {
    value: {
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      getCartCount,
      clearCart,
      updateUser,
      currentUser,
      loading,
      deliveryOptions,
      updateDeliveryOption
    }
  }, children)
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}