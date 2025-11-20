// Simple category-based product-vendor assignment
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore')

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
 * Category-based product-vendor assignment
 */
async function categoryBasedAssignment() {
  console.log('📂 Category-Based Product-Vendor Assignment')
  console.log('=' .repeat(60))
  
  try {
    const [vendorsSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, 'vendors')),
      getDocs(collection(db, 'products'))
    ])
    
    const vendors = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    console.log(`📊 Found ${vendors.length} vendors and ${products.length} products`)
    
    let assigned = 0
    let errors = 0
    
    // Process each product
    for (const product of products) {
      try {
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
        
        // Create vendor-product relationships
        for (const vendor of matchingVendors) {
          const vendorProductId = `${vendor.numericId}${product.numericId}`
          
          // Create basic vendor-product relationship
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
            
            // Vendor pricing (vendor sets, admin margin applies)
            vendorPrice: null, // To be set by vendor
            marginPercentage: null, // Set by admin per category
            marginAmount: null, // Calculated from vendor price
            finalPrice: null, // vendorPrice + marginAmount = customer visible price
            
            // Variations pricing
            variations: product.variations ? product.variations.map(variation => ({
              ...variation,
              vendorPrice: null, // Vendor sets price for each variation
              marginPercentage: null, // Same as product category
              marginAmount: null,
              finalPrice: null,
              priceSet: false
            })) : [],
            
            // Status
            available: true,
            priceSet: false, // Vendor needs to set price
            
            // Metadata
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await setDoc(doc(db, 'vendorProducts', vendorProductId), vendorProductData)
          
          console.log(`     ✅ Assigned to: ${vendor.businessName || vendor.name}`)
        }
        
        assigned++
        
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Category Assignment Complete:')
    console.log(`   ✅ Products processed: ${assigned}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('\n📋 Next Steps:')
    console.log('   1. Vendors can now set their prices in vendor dashboard')
    console.log('   2. Customer will see: Vendor Price + Margin = Final Price')
    console.log('   3. Each vendor manages their own pricing independently')
    
  } catch (error) {
    console.error('❌ Category assignment failed:', error)
  }
}

/**
 * Show assignment logic
 */
function showAssignmentLogic() {
  console.log('\n📋 Assignment Logic:')
  console.log('   Vendor Categories: ["Chicken", "Eggs"]')
  console.log('   ├── Chicken Breast → ✅ Assigned')
  console.log('   ├── Chicken Wings → ✅ Assigned') 
  console.log('   ├── White Eggs → ✅ Assigned')
  console.log('   └── Mutton Curry → ❌ Not Assigned')
  console.log('')
  console.log('   Pricing Structure:')
  console.log('   ├── Base Price: ₹200 (reference only)')
  console.log('   ├── Vendor Price: ₹180 (set by vendor)')
  console.log('   ├── Vendor Margin: ₹20 (set by vendor)')
  console.log('   └── Customer Price: ₹200 (vendor price + margin)')
  console.log('')
}

/**
 * Main function
 */
async function runCategoryAssignment() {
  console.log('🚀 Starting Category-Based Assignment')
  showAssignmentLogic()
  
  await categoryBasedAssignment()
  
  console.log('\n🎉 Assignment completed!')
  console.log('\n📋 What was created:')
  console.log('1. ✅ Products assigned to vendors by category match')
  console.log('2. ✅ Vendor-product relationships with composite IDs')
  console.log('3. ✅ Price fields ready for vendor input')
  console.log('4. ✅ Customer will see vendor-set final prices')
}

// Run assignment
runCategoryAssignment().catch(console.error)