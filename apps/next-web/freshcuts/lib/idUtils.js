// Utility functions for generating numeric IDs

/**
 * Get next counter value from Firestore
 * @param {string} counterType - Type of counter (vendors, products, customers)
 * @returns {Promise<number>} - Next counter value
 */
export const getNextCounter = async (counterType) => {
  try {
    const { doc, getDoc, updateDoc, setDoc } = await import('firebase/firestore')
    const { db } = await import('./firebase.client')
    
    const counterRef = doc(db, 'counters', counterType)
    const counterDoc = await getDoc(counterRef)
    
    let nextValue
    
    if (counterDoc.exists()) {
      const currentValue = counterDoc.data().current
      nextValue = currentValue + 1
      await updateDoc(counterRef, { current: nextValue })
    } else {
      // Initialize counter based on type
      const initialValues = {
        vendors: 1001,
        products: 1001,
        customers: 100001
      }
      nextValue = initialValues[counterType]
      await setDoc(counterRef, { 
        current: nextValue,
        prefix: counterType === 'vendors' ? 'V' : counterType === 'products' ? 'P' : 'C'
      })
    }
    
    return nextValue
  } catch (error) {
    console.error('Error getting counter:', error)
    throw error
  }
}

/**
 * Generate vendor ID
 * @returns {Promise<string>} - Vendor ID (V1001, V1002, etc.)
 */
export const generateVendorId = async () => {
  const counter = await getNextCounter('vendors')
  return `V${counter}`
}

/**
 * Generate product ID
 * @returns {Promise<string>} - Product ID (P1001, P1002, etc.)
 */
export const generateProductId = async () => {
  const counter = await getNextCounter('products')
  return `P${counter}`
}

/**
 * Generate customer ID
 * @returns {Promise<string>} - Customer ID (C100001, C100002, etc.)
 */
export const generateCustomerId = async () => {
  const counter = await getNextCounter('customers')
  return `C${counter}`
}

/**
 * Generate vendor product ID (composite)
 * @param {string} vendorId - Vendor ID (V1001)
 * @param {string} productId - Product ID (P1001)
 * @returns {string} - Vendor Product ID (V1001P1001)
 */
export const generateVendorProductId = (vendorId, productId) => {
  return `${vendorId}${productId}`
}

/**
 * Generate product variation ID
 * @param {string} vendorProductId - Vendor Product ID (V1001P1001)
 * @param {number} variationNumber - Variation number (1, 2, 3, etc.)
 * @returns {string} - Product Variation ID (V1001P1001V01)
 */
export const generateVariationId = (vendorProductId, variationNumber) => {
  const variationSuffix = `V${variationNumber.toString().padStart(2, '0')}`
  return `${vendorProductId}${variationSuffix}`
}

/**
 * Parse ID to extract components
 * @param {string} id - ID to parse
 * @returns {object} - Parsed components
 */
export const parseId = (id) => {
  // Vendor: V1001
  if (id.match(/^V\d{4}$/)) {
    return { type: 'vendor', vendorId: id }
  }
  
  // Product: P1001
  if (id.match(/^P\d{4}$/)) {
    return { type: 'product', productId: id }
  }
  
  // Customer: C100001
  if (id.match(/^C\d{6}$/)) {
    return { type: 'customer', customerId: id }
  }
  
  // Vendor Product: V1001P1001
  if (id.match(/^V\d{4}P\d{4}$/)) {
    return {
      type: 'vendorProduct',
      vendorId: id.substring(0, 5),
      productId: id.substring(5, 10)
    }
  }
  
  // Product Variation: V1001P1001V01
  if (id.match(/^V\d{4}P\d{4}V\d{2}$/)) {
    return {
      type: 'variation',
      vendorId: id.substring(0, 5),
      productId: id.substring(5, 10),
      variationId: id.substring(10, 13),
      variationNumber: parseInt(id.substring(11, 13))
    }
  }
  
  return { type: 'unknown', original: id }
}

/**
 * Check if numeric ID already exists in collection
 * @param {string} collection - Firestore collection name
 * @param {string} numericId - Numeric ID to check
 * @returns {Promise<boolean>} - True if exists
 */
export const checkIdExists = async (collection, numericId) => {
  try {
    const { collection: firestoreCollection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('./firebase.client')
    
    const q = query(
      firestoreCollection(db, collection),
      where('numericId', '==', numericId)
    )
    
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('Error checking numeric ID:', error)
    return false
  }
}

/**
 * Validate ID format
 * @param {string} id - ID to validate
 * @param {string} type - Expected type (vendor, product, customer, vendorProduct, variation)
 * @returns {boolean} - True if valid
 */
export const validateIdFormat = (id, type) => {
  const patterns = {
    vendor: /^V\d{4}$/,
    product: /^P\d{4}$/,
    customer: /^C\d{6}$/,
    vendorProduct: /^V\d{4}P\d{4}$/,
    variation: /^V\d{4}P\d{4}V\d{2}$/
  }
  
  return patterns[type] ? patterns[type].test(id) : false
}