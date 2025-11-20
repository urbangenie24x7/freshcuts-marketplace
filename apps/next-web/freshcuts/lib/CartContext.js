'use client'

import { createContext, useState, useEffect, useContext, createElement } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deliveryOptions, setDeliveryOptions] = useState({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved cart
      const savedCart = localStorage.getItem('freshcuts-cart')
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (error) {
          console.error('Error parsing saved cart:', error)
        }
      }
      
      // Load saved user
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser(user)
        } catch (error) {
          console.error('Error parsing saved user:', error)
        }
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('freshcuts-cart', JSON.stringify(cart))
    }
  }, [cart])

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
      localStorage.removeItem('freshcuts-cart')
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