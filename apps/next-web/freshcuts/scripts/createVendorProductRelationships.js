// Script to create vendor-product relationships with composite IDs
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, setDoc, addDoc } = require('firebase/firestore')

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
 * Generate vendor product composite ID
 */
function generateVendorProductId(vendorId, productId) {
  return `${vendorId}${productId}`
}

/**
 * Generate variation composite ID
 */
function generateVariationCompositeId(vendorId, productId, variationNumber) {
  const vendorProductId = generateVendorProductId(vendorId, productId)
  const variationSuffix = `V${variationNumber.toString().padStart(2, '0')}`
  return `${vendorProductId}${variationSuffix}`
}

/**
 * Create vendor-product relationships
 */
async function createVendorProductRelationships() {
  console.log('🔄 Creating Vendor-Product Relationships...')
  console.log('=' .repeat(60))
  
  try {
    // Get all vendors and products
    const [vendorsSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, 'vendors')),
      getDocs(collection(db, 'products'))
    ])
    
    const vendors = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    console.log(`📊 Found ${vendors.length} vendors and ${products.length} products`)
    
    let vendorProductsCreated = 0
    let variationsCreated = 0
    let errors = 0
    
    // Process each product
    for (const product of products) {
      try {
        if (!product.numericId) {
          console.log(`⏭️  Skipping product ${product.id} - No numeric ID`)
          continue
        }
        
        // Find vendor for this product
        const vendor = vendors.find(v => v.id === product.vendorId)
        if (!vendor || !vendor.numericId) {
          console.log(`⏭️  Skipping product ${product.name} - No vendor or vendor numeric ID`)
          continue
        }
        
        const vendorProductId = generateVendorProductId(vendor.numericId, product.numericId)
        
        console.log(`\n🔄 Processing: ${vendor.businessName || vendor.name} × ${product.name}`)
        console.log(`   Vendor: ${vendor.numericId}, Product: ${product.numericId}`)
        console.log(`   Composite ID: ${vendorProductId}`)
        
        // Create vendor-product relationship
        const vendorProductData = {
          compositeId: vendorProductId,
          vendorId: vendor.numericId,
          productId: product.numericId,
          vendorFirebaseId: vendor.id,
          productFirebaseId: product.id,
          vendorName: vendor.businessName || vendor.name,
          productName: product.name,
          basePrice: product.default_price || product.price,
          category: product.category,
          available: product.available !== false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        // Use composite ID as document ID
        await setDoc(doc(db, 'vendorProducts', vendorProductId), vendorProductData)
        vendorProductsCreated++
        console.log(`   ✅ Created vendor-product: ${vendorProductId}`)
        
        // Process variations if they exist
        if (product.variations && Array.isArray(product.variations)) {
          console.log(`   🔄 Processing ${product.variations.length} variations...`)
          
          for (const variation of product.variations) {
            try {
              if (!variation.variationId) {
                console.log(`   ⏭️  Skipping variation - No variationId`)
                continue
              }
              
              // Extract variation number from variationId (P1001V01 -> 01)
              const variationMatch = variation.variationId.match(/V(\d{2})$/)
              const variationNumber = variationMatch ? parseInt(variationMatch[1]) : variation.variationNumber || 1
              
              const variationCompositeId = generateVariationCompositeId(
                vendor.numericId, 
                product.numericId, 
                variationNumber
              )
              
              const variationData = {
                compositeId: variationCompositeId,
                vendorId: vendor.numericId,
                productId: product.numericId,
                vendorProductId: vendorProductId,
                variationId: variation.variationId,
                variationNumber: variationNumber,
                name: variation.name,
                priceMultiplier: variation.priceMultiplier || 1,
                finalPrice: (product.default_price || product.price) * (variation.priceMultiplier || 1),
                available: variation.available !== false,
                originalVariationId: variation.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              
              // Use composite ID as document ID
              await setDoc(doc(db, 'vendorProductVariations', variationCompositeId), variationData)
              variationsCreated++
              console.log(`     ✅ Created variation: ${variationCompositeId} (${variation.name})`)
              
            } catch (error) {
              console.error(`     ❌ Error creating variation:`, error)
              errors++
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${product.id}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Vendor-Product Relationships Created:')
    console.log(`   ✅ Vendor Products: ${vendorProductsCreated}`)
    console.log(`   ✅ Variations: ${variationsCreated}`)
    console.log(`   ❌ Errors: ${errors}`)
    
  } catch (error) {
    console.error('❌ Vendor-product relationship creation failed:', error)
  }
}

/**
 * Show examples
 */
function showExamples() {
  console.log('\n📋 Composite ID Structure:')
  console.log('   Vendor: V1001 (Secunderabad Chicken Center)')
  console.log('   Product: P1001 (Chicken Breast)')
  console.log('   Vendor Product: V1001P1001')
  console.log('   Variations:')
  console.log('     - V1001P1001V01 (500g variant)')
  console.log('     - V1001P1001V02 (1kg variant)')
  console.log('     - V1001P1001V03 (2kg variant)')
  console.log('')
}

/**
 * Main function
 */
async function runRelationshipCreation() {
  console.log('🚀 Starting Vendor-Product Relationship Creation')
  showExamples()
  
  await createVendorProductRelationships()
  
  console.log('\n🎉 Relationship creation completed!')
  console.log('\n📋 Collections created:')
  console.log('1. vendorProducts - Composite vendor-product relationships')
  console.log('2. vendorProductVariations - Composite variation relationships')
}

// Run creation
runRelationshipCreation().catch(console.error)