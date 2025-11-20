// Clean existing assignments and reassign based on vendor categories
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, setDoc } = require('firebase/firestore')

// Firebase config
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

/**
 * Get category margin percentage for dummy data
 */
function getCategoryMarginPercentage(category) {
  const margins = {
    'Chicken': 15,
    'Premium Chicken': 20,
    'Mutton': 18,
    'Fish': 20,
    'Eggs': 12,
    'Prawns': 25
  }
  
  // Find matching category
  for (const [cat, margin] of Object.entries(margins)) {
    if (category?.toLowerCase().includes(cat.toLowerCase()) || 
        cat.toLowerCase().includes(category?.toLowerCase())) {
      return margin
    }
  }
  
  return 15 // Default margin
}

/**
 * Clean existing product-vendor assignments
 */
async function cleanExistingAssignments() {
  console.log('🧹 Cleaning existing product-vendor assignments...')
  
  try {
    // Remove vendorId from all products
    const productsSnap = await getDocs(collection(db, 'products'))
    let cleaned = 0
    
    for (const productDoc of productsSnap.docs) {
      const data = productDoc.data()
      
      if (data.vendorId || data.vendorNumericId || data.vendorName) {
        await updateDoc(doc(db, 'products', productDoc.id), {
          vendorId: null,
          vendorNumericId: null,
          vendorName: null,
          assignedVendors: null,
          vendorCount: null,
          lastAssigned: null,
          updatedAt: new Date()
        })
        
        console.log(`   ✅ Cleaned: ${data.name}`)
        cleaned++
      }
    }
    
    // Delete existing vendorProducts collection
    const vendorProductsSnap = await getDocs(collection(db, 'vendorProducts'))
    let deletedVendorProducts = 0
    
    for (const docSnap of vendorProductsSnap.docs) {
      await deleteDoc(doc(db, 'vendorProducts', docSnap.id))
      deletedVendorProducts++
    }
    
    // Delete existing vendorProductVariations collection
    const variationsSnap = await getDocs(collection(db, 'vendorProductVariations'))
    let deletedVariations = 0
    
    for (const docSnap of variationsSnap.docs) {
      await deleteDoc(doc(db, 'vendorProductVariations', docSnap.id))
      deletedVariations++
    }
    
    console.log(`   ✅ Cleaned ${cleaned} products`)
    console.log(`   ✅ Deleted ${deletedVendorProducts} vendor-product relationships`)
    console.log(`   ✅ Deleted ${deletedVariations} product variations`)
    
  } catch (error) {
    console.error('❌ Error cleaning assignments:', error)
  }
}

/**
 * Fresh category-based assignment
 */
async function freshCategoryAssignment() {
  console.log('\n🔄 Fresh Category-Based Assignment...')
  
  try {
    const [vendorsSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, 'vendors')),
      getDocs(collection(db, 'products'))
    ])
    
    const vendors = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    console.log(`📊 Found ${vendors.length} vendors and ${products.length} products`)
    
    let assigned = 0
    let totalRelationships = 0
    
    // Process each product
    for (const product of products) {
      try {
        if (!product.numericId) {
          console.log(`⏭️  Skipping ${product.name} - No numeric ID`)
          continue
        }
        
        console.log(`\n🔄 Processing: ${product.name} (${product.category})`)
        
        // Find vendors that sell this category
        const matchingVendors = vendors.filter(vendor => {
          if (!vendor.numericId || !vendor.categories) return false
          
          // Check if vendor sells this category
          return vendor.categories.some(vendorCategory => 
            vendorCategory.toLowerCase().includes(product.category?.toLowerCase()) ||
            product.category?.toLowerCase().includes(vendorCategory.toLowerCase())
          )
        })
        
        if (matchingVendors.length === 0) {
          console.log(`   ⚠️  No vendors found for category: ${product.category}`)
          continue
        }
        
        console.log(`   ✅ Found ${matchingVendors.length} matching vendors`)
        
        // Create fresh vendor-product relationships
        for (const vendor of matchingVendors) {
          const vendorProductId = `${vendor.numericId}${product.numericId}`
          
          // Create vendor-product relationship with pricing structure
          const vendorProductData = {
            compositeId: vendorProductId,
            vendorId: vendor.numericId,
            productId: product.numericId,
            vendorFirebaseId: vendor.id,
            productFirebaseId: product.id,
            
            // Product info
            productName: product.name,
            category: product.category,
            basePrice: product.default_price, // Reference price only
            
            // Vendor info
            vendorName: vendor.businessName || vendor.name,
            vendorLocation: vendor.location,
            
            // Vendor pricing with dummy data
            vendorPrice: (() => {
              // Generate realistic dummy vendor price (80%-120% of base price)
              const basePrice = product.default_price || 200
              return Math.round(basePrice * (0.8 + Math.random() * 0.4))
            })(),
            marginPercentage: getCategoryMarginPercentage(product.category),
            marginAmount: (() => {
              const basePrice = product.default_price || 200
              const vendorPrice = Math.round(basePrice * (0.8 + Math.random() * 0.4))
              const marginPercentage = getCategoryMarginPercentage(product.category)
              return Math.round(vendorPrice * (marginPercentage / 100))
            })(),
            finalPrice: (() => {
              const basePrice = product.default_price || 200
              const vendorPrice = Math.round(basePrice * (0.8 + Math.random() * 0.4))
              const marginPercentage = getCategoryMarginPercentage(product.category)
              const marginAmount = Math.round(vendorPrice * (marginPercentage / 100))
              return vendorPrice + marginAmount
            })()
            
            // Variations pricing with dummy data
            variations: product.variations ? product.variations.map((variation, index) => {
              // Generate realistic dummy prices based on variation multiplier
              const baseVendorPrice = Math.round((product.default_price || 200) * (variation.priceMultiplier || 1) * (0.8 + Math.random() * 0.4)) // 80%-120% of base
              const categoryMargin = getCategoryMarginPercentage(product.category)
              const marginAmount = Math.round(baseVendorPrice * (categoryMargin / 100))
              const finalPrice = baseVendorPrice + marginAmount
              
              return {
                ...variation,
                vendorPrice: baseVendorPrice, // Dummy vendor price
                marginPercentage: categoryMargin,
                marginAmount: marginAmount,
                finalPrice: finalPrice, // Customer visible price
                priceSet: true // Mark as set for demo
              }
            }) : [],
            
            // Status
            available: true,
            priceSet: true, // Dummy prices set for demo
            
            // Metadata
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await setDoc(doc(db, 'vendorProducts', vendorProductId), vendorProductData)
          
          console.log(`     ✅ Assigned to: ${vendor.businessName || vendor.name} (${vendorProductId})`)
          totalRelationships++
        }
        
        assigned++
        
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error)
      }
    }
    
    console.log('\n📊 Fresh Assignment Complete:')
    console.log(`   ✅ Products processed: ${assigned}`)
    console.log(`   ✅ Vendor-product relationships created: ${totalRelationships}`)
    
  } catch (error) {
    console.error('❌ Fresh assignment failed:', error)
  }
}

/**
 * Main function
 */
async function runCleanAndReassign() {
  console.log('🚀 Clean and Reassign Products to Vendors')
  console.log('=' .repeat(60))
  
  await cleanExistingAssignments()
  await freshCategoryAssignment()
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Clean and reassign completed!')
  console.log('\n📋 What happened:')
  console.log('1. ✅ Removed all existing product-vendor assignments')
  console.log('2. ✅ Deleted old vendor-product relationships')
  console.log('3. ✅ Created fresh assignments based on vendor categories')
  console.log('4. ✅ Set up pricing structure for vendor management')
  console.log('\n📋 Next steps:')
  console.log('1. Setup category margins: node scripts/setupCategoryMargins.js')
  console.log('2. Vendors can now set prices in their dashboard')
}

// Run clean and reassign
runCleanAndReassign().catch(console.error)