// Master service for vendors and products with numeric ID support
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { db } from './firebase.client'
import { 
  generateVendorId, 
  generateProductId, 
  generateCustomerId,
  generateVendorProductId,
  generateVariationId,
  validateIdFormat
} from './idUtils'

/**
 * Vendor Master Service
 */
export class VendorService {
  static collection = 'vendors'

  /**
   * Get vendor by Firebase ID or numeric ID
   */
  static async getById(id) {
    try {
      // Try Firebase ID first
      const docRef = doc(db, this.collection, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      // Try numeric ID
      const q = query(
        collection(db, this.collection),
        where('numericId', '==', id)
      )
      const querySnap = await getDocs(q)
      
      if (!querySnap.empty) {
        const doc = querySnap.docs[0]
        return { id: doc.id, ...doc.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting vendor:', error)
      return null
    }
  }

  /**
   * Create new vendor with numeric ID
   */
  static async create(vendorData) {
    try {
      const businessName = vendorData.businessName || vendorData.name
      if (!businessName) {
        throw new Error('Business name is required')
      }

      const numericId = await generateVendorId()
      
      const newVendor = {
        ...vendorData,
        numericId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, this.collection), newVendor)
      return { id: docRef.id, ...newVendor }
    } catch (error) {
      console.error('Error creating vendor:', error)
      throw error
    }
  }

  /**
   * Update vendor
   */
  static async update(id, updateData) {
    try {
      const vendor = await this.getById(id)
      if (!vendor) {
        throw new Error('Vendor not found')
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, this.collection, vendor.id), updatedData)
      return { id: vendor.id, ...vendor, ...updatedData }
    } catch (error) {
      console.error('Error updating vendor:', error)
      throw error
    }
  }

  /**
   * Get all vendors
   */
  static async getAll() {
    try {
      const q = query(collection(db, this.collection), orderBy('createdAt', 'desc'))
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting vendors:', error)
      return []
    }
  }
}

/**
 * Product Master Service
 */
export class ProductService {
  static collection = 'products'

  /**
   * Get product by Firebase ID or numeric ID
   */
  static async getById(id) {
    try {
      // Try Firebase ID first
      const docRef = doc(db, this.collection, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      // Try numeric ID
      const q = query(
        collection(db, this.collection),
        where('numericId', '==', id)
      )
      const querySnap = await getDocs(q)
      
      if (!querySnap.empty) {
        const doc = querySnap.docs[0]
        return { id: doc.id, ...doc.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting product:', error)
      return null
    }
  }

  /**
   * Create new product with numeric ID
   */
  static async create(productData) {
    try {
      const productName = productData.name
      if (!productName) {
        throw new Error('Product name is required')
      }

      const numericId = await generateProductId()
      
      const newProduct = {
        ...productData,
        numericId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, this.collection), newProduct)
      return { id: docRef.id, ...newProduct }
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  /**
   * Update product
   */
  static async update(id, updateData) {
    try {
      const product = await this.getById(id)
      if (!product) {
        throw new Error('Product not found')
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, this.collection, product.id), updatedData)
      return { id: product.id, ...product, ...updatedData }
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  /**
   * Get products by vendor
   */
  static async getByVendor(vendorId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      )
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting products by vendor:', error)
      return []
    }
  }

  /**
   * Get all products
   */
  static async getAll() {
    try {
      const q = query(collection(db, this.collection), orderBy('createdAt', 'desc'))
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting products:', error)
      return []
    }
  }
}

/**
 * Vendor Product Service (Composite IDs)
 */
export class VendorProductService {
  static collection = 'vendorProducts'

  /**
   * Create vendor product with composite ID
   */
  static async create(vendorId, productId, vendorProductData) {
    try {
      if (!validateIdFormat(vendorId, 'vendor') || !validateIdFormat(productId, 'product')) {
        throw new Error('Invalid vendor or product ID format')
      }

      const compositeId = generateVendorProductId(vendorId, productId)
      
      const newVendorProduct = {
        ...vendorProductData,
        vendorId,
        productId,
        compositeId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, this.collection), newVendorProduct)
      return { id: docRef.id, ...newVendorProduct }
    } catch (error) {
      console.error('Error creating vendor product:', error)
      throw error
    }
  }

  /**
   * Create product variation
   */
  static async createVariation(vendorId, productId, variationNumber, variationData) {
    try {
      const vendorProductId = generateVendorProductId(vendorId, productId)
      const variationId = generateVariationId(vendorProductId, variationNumber)
      
      const newVariation = {
        ...variationData,
        vendorId,
        productId,
        vendorProductId,
        variationId,
        variationNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, 'productVariations'), newVariation)
      return { id: docRef.id, ...newVariation }
    } catch (error) {
      console.error('Error creating product variation:', error)
      throw error
    }
  }

  /**
   * Get vendor products by vendor ID
   */
  static async getByVendor(vendorId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      )
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting vendor products:', error)
      return []
    }
  }
}

/**
 * Customer Service
 */
export class CustomerService {
  static collection = 'customers'

  /**
   * Create new customer with numeric ID
   */
  static async create(customerData) {
    try {
      const numericId = await generateCustomerId()
      
      const newCustomer = {
        ...customerData,
        numericId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, this.collection), newCustomer)
      return { id: docRef.id, ...newCustomer }
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  /**
   * Get customer by Firebase ID or numeric ID
   */
  static async getById(id) {
    try {
      // Try Firebase ID first
      const docRef = doc(db, this.collection, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      // Try numeric ID
      const q = query(
        collection(db, this.collection),
        where('numericId', '==', id)
      )
      const querySnap = await getDocs(q)
      
      if (!querySnap.empty) {
        const doc = querySnap.docs[0]
        return { id: doc.id, ...doc.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting customer:', error)
      return null
    }
  }
}

/**
 * Composite ID Service for vendor-product relationships
 */
export class CompositeIdService {
  /**
   * Get vendor product by composite ID
   */
  static async getVendorProduct(compositeId) {
    try {
      const docRef = doc(db, 'vendorProducts', compositeId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting vendor product:', error)
      return null
    }
  }

  /**
   * Get products by vendor using composite structure
   */
  static async getProductsByVendor(vendorId) {
    try {
      const q = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendorId)
      )
      const querySnap = await getDocs(q)
      return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting vendor products:', error)
      return []
    }
  }

  /**
   * Parse composite ID
   */
  static parseCompositeId(compositeId) {
    // V1001P1001V01
    if (compositeId.match(/^V\d{4}P\d{4}V\d{2}$/)) {
      return {
        type: 'variation',
        vendorId: compositeId.substring(0, 5),
        productId: compositeId.substring(5, 10),
        variationId: compositeId.substring(10, 13)
      }
    }
    
    // V1001P1001
    if (compositeId.match(/^V\d{4}P\d{4}$/)) {
      return {
        type: 'vendorProduct',
        vendorId: compositeId.substring(0, 5),
        productId: compositeId.substring(5, 10)
      }
    }
    
    return { type: 'unknown', original: compositeId }
  }
}