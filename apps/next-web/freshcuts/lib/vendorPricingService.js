// Vendor pricing service with admin category margins
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore'
import { db } from './firebase.client'

/**
 * Vendor Pricing Service - Vendors set prices, Admin controls margins
 */
export class VendorPricingService {
  /**
   * Get category margin percentage (admin controlled)
   */
  static async getCategoryMargin(category) {
    try {
      const categoryKey = category.toLowerCase().replace(/\s+/g, '-')
      const marginDoc = await getDoc(doc(db, 'categoryMargins', categoryKey))
      
      if (marginDoc.exists()) {
        return marginDoc.data().marginPercentage
      }
      
      return 15 // Default 15% margin
    } catch (error) {
      console.error('Error getting category margin:', error)
      return 15
    }
  }

  /**
   * Get vendor's product catalog for pricing management
   */
  static async getVendorProducts(vendorId) {
    try {
      const q = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendorId)
      )
      
      const querySnap = await getDocs(q)
      const products = []
      
      for (const docSnap of querySnap.docs) {
        const data = docSnap.data()
        const categoryMargin = await this.getCategoryMargin(data.category)
        
        products.push({
          id: docSnap.id,
          ...data,
          categoryMarginPercentage: categoryMargin
        })
      }
      
      return products
    } catch (error) {
      console.error('Error getting vendor products:', error)
      return []
    }
  }

  /**
   * Vendor sets their price, admin margin is applied automatically
   */
  static async setVendorPrice(vendorProductId, vendorPrice, category) {
    try {
      // Get admin-controlled category margin
      const marginPercentage = await this.getCategoryMargin(category)
      const marginAmount = Math.round(vendorPrice * (marginPercentage / 100))
      const finalPrice = vendorPrice + marginAmount // Customer visible price
      
      await updateDoc(doc(db, 'vendorProducts', vendorProductId), {
        vendorPrice: vendorPrice,
        marginPercentage: marginPercentage,
        marginAmount: marginAmount,
        finalPrice: finalPrice, // This is what customer sees
        priceSet: true,
        available: true,
        priceLastUpdated: new Date(),
        updatedAt: new Date()
      })
      
      return {
        success: true,
        vendorPrice: vendorPrice,
        marginPercentage: marginPercentage,
        marginAmount: marginAmount,
        finalPrice: finalPrice
      }
    } catch (error) {
      console.error('Error setting vendor price:', error)
      throw error
    }
  }

  /**
   * Set vendor price for product variation
   */
  static async setVariationPrice(vendorProductId, variationId, vendorPrice, category) {
    try {
      const marginPercentage = await this.getCategoryMargin(category)
      const marginAmount = Math.round(vendorPrice * (marginPercentage / 100))
      const finalPrice = vendorPrice + marginAmount
      
      // Update the specific variation price
      const vendorProduct = await getDoc(doc(db, 'vendorProducts', vendorProductId))
      if (!vendorProduct.exists()) {
        throw new Error('Vendor product not found')
      }
      
      const data = vendorProduct.data()
      const variations = data.variations || []
      
      const updatedVariations = variations.map(variation => {
        if (variation.variationId === variationId) {
          return {
            ...variation,
            vendorPrice: vendorPrice,
            marginPercentage: marginPercentage,
            marginAmount: marginAmount,
            finalPrice: finalPrice,
            priceSet: true
          }
        }
        return variation
      })
      
      await updateDoc(doc(db, 'vendorProducts', vendorProductId), {
        variations: updatedVariations,
        updatedAt: new Date()
      })
      
      return {
        success: true,
        variationId: variationId,
        vendorPrice: vendorPrice,
        marginPercentage: marginPercentage,
        marginAmount: marginAmount,
        finalPrice: finalPrice
      }
    } catch (error) {
      console.error('Error setting variation price:', error)
      throw error
    }
  }

  /**
   * Get customer-facing prices (final prices only)
   */
  static async getCustomerPrices(productId) {
    try {
      const q = query(
        collection(db, 'vendorProducts'),
        where('productId', '==', productId),
        where('priceSet', '==', true),
        where('available', '==', true)
      )
      
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => {
        const data = doc.data()
        return {
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          finalPrice: data.finalPrice, // Only show final price to customer
          available: data.available,
          vendorLocation: data.vendorLocation
        }
      }).sort((a, b) => a.finalPrice - b.finalPrice) // Sort by price
    } catch (error) {
      console.error('Error getting customer prices:', error)
      return []
    }
  }

  /**
   * Get best price for customer
   */
  static async getBestPrice(productId) {
    try {
      const prices = await this.getCustomerPrices(productId)
      return prices.length > 0 ? prices[0] : null
    } catch (error) {
      console.error('Error getting best price:', error)
      return null
    }
  }

  /**
   * Update vendor availability
   */
  static async updateAvailability(vendorProductId, available) {
    try {
      await updateDoc(doc(db, 'vendorProducts', vendorProductId), {
        available: available,
        updatedAt: new Date()
      })
      
      return { success: true, available }
    } catch (error) {
      console.error('Error updating availability:', error)
      throw error
    }
  }
}

/**
 * Customer price display helper
 */
export const formatCustomerPrice = (prices) => {
  if (!prices || prices.length === 0) return null
  
  const minPrice = Math.min(...prices.map(p => p.finalPrice))
  const maxPrice = Math.max(...prices.map(p => p.finalPrice))
  
  return {
    bestPrice: minPrice,
    priceRange: maxPrice - minPrice,
    vendorCount: prices.length,
    vendors: prices,
    displayText: prices.length > 1 
      ? `From ₹${minPrice} • ${prices.length} vendors`
      : `₹${minPrice}`
  }
}