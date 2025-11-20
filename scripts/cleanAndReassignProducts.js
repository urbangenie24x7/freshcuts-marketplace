// Clean and reassign products with proper pricing
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: "AIzaSyAR757jp5A9sKg45vqZckfwTCLSLC-PRGk",
  authDomain: "freshcuts-5cb4c.firebaseapp.com",
  projectId: "freshcuts-5cb4c",
  storageBucket: "freshcuts-5cb4c.firebasestorage.app",
  messagingSenderId: "14592809171",
  appId: "1:14592809171:web:b618aa729d65385f3d1c26"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Category margins
const categoryMargins = {
  'Premium Chicken': 15,
  'Country Chicken': 12,
  'Fresh Eggs': 10,
  'fresh eggs': 10,
  'Mutton': 20,
  'Fish': 18,
  'Seafood': 22
}

function getCategoryMarginPercentage(category) {
  return categoryMargins[category] || 15
}

async function cleanAndReassignProducts() {
  try {
    console.log('=== Cleaning and Reassigning Products ===\n')
    
    // Get all vendors
    const vendorsSnap = await getDocs(collection(db, 'vendors'))
    const vendors = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Get all products
    const productsSnap = await getDocs(collection(db, 'products'))
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    console.log(`Found ${vendors.length} vendors and ${products.length} products`)
    
    // Clear existing vendorProducts
    const existingVendorProductsSnap = await getDocs(collection(db, 'vendorProducts'))
    console.log(`Clearing ${existingVendorProductsSnap.size} existing vendor products...`)
    
    for (const doc of existingVendorProductsSnap.docs) {
      await deleteDoc(doc.ref)
    }
    
    let assignmentCount = 0
    
    // Reassign products to vendors based on categories
    for (const vendor of vendors) {
      if (!vendor.categories || !Array.isArray(vendor.categories)) continue
      
      console.log(`\nProcessing vendor: ${vendor.businessName || vendor.name} (${vendor.numericId})`)
      console.log(`Vendor categories: ${vendor.categories.join(', ')}`)
      
      for (const product of products) {
        const productCategory = product.category || ''
        
        // Check if product category matches any vendor category
        const categoryMatch = vendor.categories.some(vendorCat => 
          vendorCat.toLowerCase().includes(productCategory.toLowerCase()) ||
          productCategory.toLowerCase().includes(vendorCat.toLowerCase()) ||
          vendorCat === productCategory
        )
        
        if (categoryMatch) {
          const compositeId = `${vendor.numericId}${product.numericId}`
          
          // Generate realistic pricing
          const basePrice = product.price || 100
          const vendorPriceMultiplier = 0.8 + (Math.random() * 0.4) // 80% to 120%
          const vendorPrice = Math.round(basePrice * vendorPriceMultiplier)
          
          const marginPercentage = getCategoryMarginPercentage(productCategory)
          const finalPrice = Math.round(vendorPrice * (1 + marginPercentage / 100))
          
          const vendorProductData = {
            vendorId: vendor.numericId,
            productId: product.numericId,
            compositeId,
            productName: product.name,
            category: productCategory,
            vendorPrice,
            marginPercentage,
            finalPrice,
            imageUrl: product.image_url,
            description: product.description,
            priceSetByVendor: true,
            available: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await setDoc(doc(db, 'vendorProducts', compositeId), vendorProductData)
          assignmentCount++
          
          console.log(`  ✓ Assigned ${product.name} - ₹${vendorPrice} → ₹${finalPrice} (${marginPercentage}% margin)`)
        }
      }
    }
    
    console.log(`\n=== Assignment Complete ===`)
    console.log(`Total assignments: ${assignmentCount}`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

cleanAndReassignProducts()