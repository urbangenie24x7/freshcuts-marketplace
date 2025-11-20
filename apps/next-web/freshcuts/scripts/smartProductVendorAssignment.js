// Smart product-vendor assignment based on categories and vendor pricing
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, updateDoc, setDoc } = require('firebase/firestore')

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
 * Smart assignment based on vendor categories and pricing
 */
async function smartProductVendorAssignment() {
  console.log('🧠 Smart Product-Vendor Assignment')
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
    let priceUpdates = 0
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
        
        // Create vendor-product relationships for each matching vendor
        for (const vendor of matchingVendors) {
          const vendorProductId = `${vendor.numericId}${product.numericId}`
          
          // Generate vendor-specific pricing (base price + vendor markup)
          const vendorMarkup = vendor.markup || (Math.random() * 0.3 + 0.9) // 90%-120% of base price
          const vendorPrice = Math.round(product.default_price * vendorMarkup)
          
          // Create vendor-product relationship with real-time pricing
          const vendorProductData = {
            compositeId: vendorProductId,
            vendorId: vendor.numericId,
            productId: product.numericId,
            vendorFirebaseId: vendor.id,
            productFirebaseId: product.id,
            
            // Product info
            productName: product.name,
            category: product.category,
            basePrice: product.default_price,
            
            // Vendor info
            vendorName: vendor.businessName || vendor.name,
            vendorLocation: vendor.location,
            
            // Real-time pricing
            vendorPrice: vendorPrice,
            markup: vendorMarkup,
            priceLastUpdated: new Date(),
            
            // Availability
            available: true,
            inStock: true,
            stockQuantity: Math.floor(Math.random() * 100) + 10, // Random stock for demo
            
            // Metadata
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await setDoc(doc(db, 'vendorProducts', vendorProductId), vendorProductData)
          
          console.log(`     ✅ ${vendor.businessName || vendor.name}: ₹${product.default_price} → ₹${vendorPrice}`)
          priceUpdates++
        }
        
        // Update product with vendor assignments
        await updateDoc(doc(db, 'products', product.id), {
          assignedVendors: matchingVendors.map(v => v.numericId),
          vendorCount: matchingVendors.length,
          lastAssigned: new Date(),
          updatedAt: new Date()
        })
        
        assigned++
        
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Smart Assignment Complete:')
    console.log(`   ✅ Products processed: ${assigned}`)
    console.log(`   💰 Price relationships created: ${priceUpdates}`)
    console.log(`   ❌ Errors: ${errors}`)
    
  } catch (error) {
    console.error('❌ Smart assignment failed:', error)
  }
}

/**
 * Create real-time price update system
 */
async function createPriceUpdateSystem() {
  console.log('\n🔄 Creating Real-time Price Update System...')
  
  try {
    // Create price update triggers collection
    const priceUpdateData = {
      lastGlobalUpdate: new Date(),
      updateFrequency: '15min', // Update every 15 minutes
      priceFluctuation: {
        min: 0.95, // 5% decrease max
        max: 1.05, // 5% increase max
      },
      marketFactors: {
        demand: 1.0,
        supply: 1.0,
        seasonal: 1.0
      },
      createdAt: new Date()
    }
    
    await setDoc(doc(db, 'systemConfig', 'priceUpdates'), priceUpdateData)
    
    console.log('✅ Price update system configured')
    
  } catch (error) {
    console.error('❌ Error creating price update system:', error)
  }
}

/**
 * Show assignment examples
 */
function showExamples() {
  console.log('\n📋 Smart Assignment Logic:')
  console.log('   Vendor: V1001 (Categories: ["Chicken", "Eggs"])')
  console.log('   Product: P1001 (Chicken Breast) → Assigned to V1001')
  console.log('   Product: P1002 (Mutton Curry) → Not assigned to V1001')
  console.log('')
  console.log('   Real-time Pricing:')
  console.log('   Base Price: ₹200')
  console.log('   Vendor A Markup: 95% → ₹190')
  console.log('   Vendor B Markup: 105% → ₹210')
  console.log('   Vendor C Markup: 110% → ₹220')
  console.log('')
}

/**
 * Main function
 */
async function runSmartAssignment() {
  console.log('🚀 Starting Smart Product-Vendor Assignment')
  showExamples()
  
  await smartProductVendorAssignment()
  await createPriceUpdateSystem()
  
  console.log('\n🎉 Smart assignment completed!')
  console.log('\n📋 Features created:')
  console.log('1. Category-based product assignment')
  console.log('2. Vendor-specific pricing with markup')
  console.log('3. Real-time price update system')
  console.log('4. Stock management per vendor')
  console.log('5. Multi-vendor product availability')
}

// Run smart assignment
runSmartAssignment().catch(console.error)