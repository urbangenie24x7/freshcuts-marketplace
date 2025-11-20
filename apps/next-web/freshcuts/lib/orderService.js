import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from './firebase.client'

export const orderService = {
  // Update order status and create tracking entry
  async updateOrderStatus(orderId, newStatus, message = null, deliveryPartnerId = null) {
    try {
      const orderRef = doc(db, 'orders', orderId)
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      }

      if (deliveryPartnerId) {
        updateData.deliveryPartnerId = deliveryPartnerId
      }

      // Generate tracking ID for delivery statuses
      if (newStatus === 'assigned_for_delivery' && !updateData.trackingId) {
        updateData.trackingId = `FC${Date.now().toString().slice(-8)}`
      }

      await updateDoc(orderRef, updateData)

      // Add tracking entry
      await addDoc(collection(db, 'orderTracking'), {
        orderId,
        status: newStatus,
        message: message || `Order ${newStatus.replace('_', ' ')}`,
        timestamp: new Date(),
        deliveryPartnerId
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  },

  // Assign delivery partner
  async assignDeliveryPartner(orderId, partnerId, partnerType, partnerName) {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        deliveryPartnerId: partnerId,
        deliveryPartnerType: partnerType,
        deliveryPartnerName: partnerName,
        status: 'assigned_for_delivery',
        trackingId: `FC${Date.now().toString().slice(-8)}`,
        updatedAt: new Date()
      })

      // Add tracking entry
      await addDoc(collection(db, 'orderTracking'), {
        orderId,
        status: 'assigned_for_delivery',
        message: `Assigned to ${partnerType === 'vendor' ? 'vendor' : 'delivery partner'}: ${partnerName}`,
        timestamp: new Date(),
        deliveryPartnerId: partnerId
      })

      return { success: true }
    } catch (error) {
      console.error('Error assigning delivery partner:', error)
      throw error
    }
  },

  // Get order tracking history
  async getOrderTracking(orderId) {
    try {
      const trackingQuery = query(
        collection(db, 'orderTracking'),
        where('orderId', '==', orderId),
        orderBy('timestamp', 'desc')
      )
      const trackingSnap = await getDocs(trackingQuery)
      return trackingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting order tracking:', error)
      throw error
    }
  },

  // Get orders by vendor
  async getVendorOrders(vendorId) {
    try {
      console.log('Getting orders for vendorId:', vendorId)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('vendorId', '==', vendorId)
      )
      const ordersSnap = await getDocs(ordersQuery)
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('Found orders:', orders.length)
      return orders
    } catch (error) {
      console.error('Error getting vendor orders:', error)
      // Return empty array instead of throwing to prevent page crash
      return []
    }
  },

  // Get orders by delivery partner
  async getDeliveryPartnerOrders(partnerId) {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('deliveryPartnerId', '==', partnerId),
        orderBy('createdAt', 'desc')
      )
      const ordersSnap = await getDocs(ordersQuery)
      return ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting delivery partner orders:', error)
      throw error
    }
  }
}