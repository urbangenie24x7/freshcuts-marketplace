import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

// User Profile Management
export const userService = {
  async createProfile(userId, profileData) {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    })
  },

  async updateProfile(userId, updates) {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...updates,
      lastActiveAt: serverTimestamp()
    })
  },

  async getProfile(userId) {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null
  },

  async addAddress(userId, addressData) {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const addresses = userSnap.data().addresses || []
      const newAddress = {
        id: `addr_${Date.now()}`,
        ...addressData,
        createdAt: new Date()
      }
      
      // Set as default if it's the first address or explicitly marked
      if (addresses.length === 0 || addressData.isDefault) {
        addresses.forEach(addr => addr.isDefault = false)
        newAddress.isDefault = true
      }
      
      addresses.push(newAddress)
      await updateDoc(userRef, { addresses })
      return newAddress
    }
    throw new Error('User not found')
  },

  async updateAddress(userId, addressId, updates) {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const addresses = userSnap.data().addresses || []
      const addressIndex = addresses.findIndex(addr => addr.id === addressId)
      
      if (addressIndex >= 0) {
        addresses[addressIndex] = { ...addresses[addressIndex], ...updates }
        await updateDoc(userRef, { addresses })
        return addresses[addressIndex]
      }
    }
    throw new Error('Address not found')
  }
}

// Cart Management
export const cartService = {
  async getCart(userId) {
    const cartRef = doc(db, 'carts', userId)
    const cartSnap = await getDoc(cartRef)
    return cartSnap.exists() ? cartSnap.data() : { items: [], updatedAt: new Date() }
  },

  async updateCart(userId, items) {
    const cartRef = doc(db, 'carts', userId)
    await updateDoc(cartRef, {
      items,
      updatedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })
  },

  async addToCart(userId, item) {
    const cart = await this.getCart(userId)
    const existingIndex = cart.items.findIndex(i => 
      i.productId === item.productId && 
      i.vendorId === item.vendorId &&
      JSON.stringify(i.selectedVariation) === JSON.stringify(item.selectedVariation)
    )

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity
    } else {
      cart.items.push({
        ...item,
        id: `${item.productId}-${item.vendorId}-${Date.now()}`,
        addedAt: new Date()
      })
    }

    await this.updateCart(userId, cart.items)
    return cart.items
  },

  async removeFromCart(userId, itemId) {
    const cart = await this.getCart(userId)
    cart.items = cart.items.filter(item => item.id !== itemId)
    await this.updateCart(userId, cart.items)
    return cart.items
  },

  async clearCart(userId) {
    const cartRef = doc(db, 'carts', userId)
    await updateDoc(cartRef, {
      items: [],
      deliveryOptions: {},
      updatedAt: serverTimestamp()
    })
  },

  async getDeliveryOptions(userId) {
    const cartRef = doc(db, 'carts', userId)
    const cartSnap = await getDoc(cartRef)
    return cartSnap.exists() ? (cartSnap.data().deliveryOptions || {}) : {}
  },

  async updateDeliveryOptions(userId, options) {
    const cartRef = doc(db, 'carts', userId)
    await updateDoc(cartRef, {
      deliveryOptions: options,
      updatedAt: serverTimestamp()
    })
  }
}

// Enhanced Order Management
export const orderService = {
  async createOrder(orderData) {
    console.log('OrderService: Creating order with customerId:', orderData.customerId)
    return runTransaction(db, async (transaction) => {
      // Create parent order
      const parentOrderRef = doc(collection(db, 'parentOrders'))
      const parentOrder = {
        customerId: orderData.customerId,
        totalAmount: orderData.totalAmount,
        status: 'confirmed',
        deliveryAddress: orderData.deliveryAddress,
        email: orderData.email,
        paymentStatus: 'pending',
        vendorOrders: [],
        createdAt: serverTimestamp(),
        statusHistory: [{
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Order confirmed'
        }]
      }
      transaction.set(parentOrderRef, parentOrder)

      // Create vendor sub-orders
      const vendorOrderIds = []
      for (const vendorGroup of orderData.vendorGroups) {
        const vendorOrderRef = doc(collection(db, 'orders'))
        const vendorOrder = {
          parentOrderId: parentOrderRef.id,
          customerId: orderData.customerId,
          customerName: orderData.customerName || 'Customer',
          customerPhone: orderData.customerPhone || '',
          vendorId: vendorGroup.vendorId,
          vendorName: vendorGroup.vendorName,
          items: vendorGroup.items,
          subtotal: vendorGroup.subtotal,
          deliveryCharge: vendorGroup.deliveryCharge,
          tax: vendorGroup.tax,
          total: vendorGroup.total,
          deliveryOption: vendorGroup.deliveryOption,
          timeSlot: orderData.timeSlot,
          status: 'confirmed',
          createdAt: serverTimestamp(),
          statusHistory: [{
            status: 'confirmed',
            timestamp: new Date(),
            note: 'Order confirmed'
          }]
        }
        transaction.set(vendorOrderRef, vendorOrder)
        vendorOrderIds.push(vendorOrderRef.id)

        // Update inventory for each item
        for (const item of vendorGroup.items) {
          const vendorProductQuery = query(
            collection(db, 'vendorProducts'),
            where('vendorId', '==', vendorGroup.vendorId),
            where('productId', '==', item.productId)
          )
          const vendorProductSnap = await getDocs(vendorProductQuery)
          
          if (!vendorProductSnap.empty) {
            const vendorProductRef = vendorProductSnap.docs[0].ref
            const vendorProduct = vendorProductSnap.docs[0].data()
            
            if (vendorProduct.stockQuantity < item.quantity) {
              throw new Error(`Insufficient stock for ${item.name}`)
            }
            
            transaction.update(vendorProductRef, {
              stockQuantity: vendorProduct.stockQuantity - item.quantity,
              reservedQuantity: (vendorProduct.reservedQuantity || 0) - item.quantity
            })
          }
        }
      }

      // Update parent order with vendor order IDs
      transaction.update(parentOrderRef, { vendorOrders: vendorOrderIds })

      return { parentOrderId: parentOrderRef.id, vendorOrderIds }
    })
  },

  async updateOrderStatus(orderId, status, note = '') {
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)
    
    if (orderSnap.exists()) {
      const statusHistory = orderSnap.data().statusHistory || []
      statusHistory.push({
        status,
        timestamp: new Date(),
        note
      })
      
      await updateDoc(orderRef, {
        status,
        statusHistory,
        updatedAt: serverTimestamp()
      })
    }
  },

  async getOrdersByUser(userId) {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const ordersSnap = await getDocs(ordersQuery)
    return ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  async getOrdersByVendor(vendorId) {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    )
    const ordersSnap = await getDocs(ordersQuery)
    return ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}

// Inventory Management
export const inventoryService = {
  async updateStock(vendorId, productId, quantity) {
    const vendorProductQuery = query(
      collection(db, 'vendorProducts'),
      where('vendorId', '==', vendorId),
      where('productId', '==', productId)
    )
    const vendorProductSnap = await getDocs(vendorProductQuery)
    
    if (!vendorProductSnap.empty) {
      const vendorProductRef = vendorProductSnap.docs[0].ref
      await updateDoc(vendorProductRef, {
        stockQuantity: quantity,
        lastRestocked: serverTimestamp()
      })
    }
  },

  async reserveStock(vendorId, productId, quantity) {
    const vendorProductQuery = query(
      collection(db, 'vendorProducts'),
      where('vendorId', '==', vendorId),
      where('productId', '==', productId)
    )
    const vendorProductSnap = await getDocs(vendorProductQuery)
    
    if (!vendorProductSnap.empty) {
      const vendorProductRef = vendorProductSnap.docs[0].ref
      const vendorProduct = vendorProductSnap.docs[0].data()
      
      await updateDoc(vendorProductRef, {
        reservedQuantity: (vendorProduct.reservedQuantity || 0) + quantity
      })
    }
  },

  async getLowStockItems(vendorId) {
    const vendorProductsQuery = query(
      collection(db, 'vendorProducts'),
      where('vendorId', '==', vendorId),
      where('available', '==', true)
    )
    const vendorProductsSnap = await getDocs(vendorProductsQuery)
    
    return vendorProductsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.stockQuantity <= (item.lowStockThreshold || 10))
  }
}

// Analytics Service
export const analyticsService = {
  async trackEvent(eventType, userId, metadata = {}) {
    await addDoc(collection(db, 'analytics'), {
      type: eventType,
      userId,
      metadata,
      timestamp: serverTimestamp(),
      sessionId: `session_${Date.now()}`
    })
  },

  async logError(errorType, userId, error, context = {}) {
    await addDoc(collection(db, 'errorLogs'), {
      type: errorType,
      userId,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code || 'UNKNOWN_ERROR'
      },
      context,
      timestamp: serverTimestamp(),
      resolved: false
    })
  }
}

// Payment Reconciliation Service
export const reconciliationService = {
  async calculateVendorEarnings(vendorId, startDate, endDate) {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'delivered'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    )
    
    const refundsQuery = query(
      collection(db, 'refunds'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'approved'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    )
    
    const [ordersSnap, refundsSnap] = await Promise.all([
      getDocs(ordersQuery),
      getDocs(refundsQuery)
    ])
    
    let totalRevenue = 0
    let totalOrders = 0
    let totalRefunds = 0
    let refundCount = 0
    const commissionRate = 0.15
    
    ordersSnap.docs.forEach(doc => {
      const order = doc.data()
      totalRevenue += order.subtotal || 0
      totalOrders += 1
    })
    
    refundsSnap.docs.forEach(doc => {
      const refund = doc.data()
      totalRefunds += refund.amount || 0
      refundCount += 1
    })
    
    const netRevenue = totalRevenue - totalRefunds
    const platformCommission = netRevenue * commissionRate
    
    return {
      vendorId,
      period: { startDate, endDate },
      totalRevenue,
      totalRefunds,
      netRevenue,
      totalOrders,
      refundCount,
      platformCommission,
      netEarnings: netRevenue - platformCommission,
      commissionRate
    }
  },

  async getVendorPayments(vendorId) {
    const paymentsQuery = query(
      collection(db, 'paymentReconciliations'),
      where('vendorId', '==', vendorId)
    )
    
    const paymentsSnap = await getDocs(paymentsQuery)
    return paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  },

  async getPendingPayments() {
    const pendingQuery = query(
      collection(db, 'paymentReconciliations'),
      where('status', '==', 'pending')
    )
    
    const pendingSnap = await getDocs(pendingQuery)
    return pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}