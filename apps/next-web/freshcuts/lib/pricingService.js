// Real-time pricing service for vendor products
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { db } from './firebase.client'

/**
 * Pricing Service for real-time vendor pricing
 */
export class PricingService {
  /**
   * Get product prices from all vendors
   */
  static async getProductPrices(productId) {
    try {
      const q = query(
        collection(db, 'vendorProducts'),
        where('productId', '==', productId),
        where('available', '==', true),
        orderBy('vendorPrice', 'asc')
      )
      
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        savings: doc.data().basePrice - doc.data().vendorPrice
      }))
    } catch (error) {
      console.error('Error getting product prices:', error)
      return []
    }
  }

  /**
   * Get best price for a product
   */
  static async getBestPrice(productId) {
    try {
      const prices = await this.getProductPrices(productId)
      return prices.length > 0 ? prices[0] : null
    } catch (error) {
      console.error('Error getting best price:', error)
      return null
    }
  }

  /**
   * Get vendor's product catalog with pricing
   */
  static async getVendorCatalog(vendorId) {
    try {
      const q = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendorId),
        where('available', '==', true)
      )
      
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting vendor catalog:', error)
      return []
    }
  }

  /**
   * Update vendor pricing
   */
  static async updateVendorPrice(vendorProductId, newPrice, reason = 'manual') {
    try {
      const vendorProduct = await getDoc(doc(db, 'vendorProducts', vendorProductId))
      
      if (!vendorProduct.exists()) {
        throw new Error('Vendor product not found')
      }
      
      const currentData = vendorProduct.data()
      const priceChange = newPrice - currentData.vendorPrice
      const percentageChange = (priceChange / currentData.vendorPrice) * 100
      
      await updateDoc(doc(db, 'vendorProducts', vendorProductId), {
        vendorPrice: newPrice,
        previousPrice: currentData.vendorPrice,
        priceChange: priceChange,
        percentageChange: percentageChange,
        priceLastUpdated: new Date(),
        priceUpdateReason: reason,
        updatedAt: new Date()
      })
      
      // Log price change
      await this.logPriceChange(vendorProductId, currentData.vendorPrice, newPrice, reason)
      
      return {
        success: true,
        oldPrice: currentData.vendorPrice,
        newPrice: newPrice,
        change: priceChange,
        percentageChange: percentageChange
      }
    } catch (error) {
      console.error('Error updating vendor price:', error)
      throw error
    }
  }

  /**
   * Log price changes for analytics
   */
  static async logPriceChange(vendorProductId, oldPrice, newPrice, reason) {
    try {
      const priceLog = {
        vendorProductId,
        oldPrice,
        newPrice,
        change: newPrice - oldPrice,
        percentageChange: ((newPrice - oldPrice) / oldPrice) * 100,
        reason,
        timestamp: new Date()
      }
      
      await addDoc(collection(db, 'priceHistory'), priceLog)
    } catch (error) {
      console.error('Error logging price change:', error)
    }
  }

  /**
   * Get price comparison for a product across vendors
   */
  static async getPriceComparison(productId) {
    try {
      const prices = await this.getProductPrices(productId)
      
      if (prices.length === 0) return null
      
      const minPrice = Math.min(...prices.map(p => p.vendorPrice))
      const maxPrice = Math.max(...prices.map(p => p.vendorPrice))
      const avgPrice = prices.reduce((sum, p) => sum + p.vendorPrice, 0) / prices.length
      
      return {
        productId,
        vendorCount: prices.length,
        minPrice,
        maxPrice,
        avgPrice: Math.round(avgPrice),
        priceRange: maxPrice - minPrice,
        vendors: prices.map(p => ({
          vendorId: p.vendorId,
          vendorName: p.vendorName,
          price: p.vendorPrice,
          savings: maxPrice - p.vendorPrice,
          isLowest: p.vendorPrice === minPrice,
          isHighest: p.vendorPrice === maxPrice
        }))
      }
    } catch (error) {
      console.error('Error getting price comparison:', error)
      return null
    }
  }

  /**
   * Apply market-based price updates
   */
  static async applyMarketUpdates() {
    try {
      console.log('🔄 Applying market-based price updates...')
      
      const vendorProductsSnap = await getDocs(collection(db, 'vendorProducts'))
      let updated = 0
      
      for (const docSnap of vendorProductsSnap.docs) {
        const data = docSnap.data()
        
        // Skip if updated recently (within 15 minutes)
        const lastUpdate = data.priceLastUpdated?.toDate()
        const now = new Date()
        if (lastUpdate && (now - lastUpdate) < 15 * 60 * 1000) {
          continue
        }
        
        // Apply small random price fluctuation (±2%)
        const fluctuation = (Math.random() - 0.5) * 0.04 // -2% to +2%
        const newPrice = Math.round(data.vendorPrice * (1 + fluctuation))
        
        if (newPrice !== data.vendorPrice) {
          await this.updateVendorPrice(docSnap.id, newPrice, 'market_update')
          updated++
        }
      }
      
      console.log(`✅ Updated ${updated} prices based on market conditions`)
      return updated
    } catch (error) {
      console.error('Error applying market updates:', error)
      return 0
    }
  }
}

/**
 * Price comparison component helper
 */
export const formatPriceComparison = (comparison) => {
  if (!comparison) return null
  
  return {
    ...comparison,
    formattedPrices: {
      min: `₹${comparison.minPrice}`,
      max: `₹${comparison.maxPrice}`,
      avg: `₹${comparison.avgPrice}`,
      range: `₹${comparison.priceRange}`
    },
    savingsText: comparison.priceRange > 0 
      ? `Save up to ₹${comparison.priceRange}` 
      : 'Same price across vendors'
  }
}