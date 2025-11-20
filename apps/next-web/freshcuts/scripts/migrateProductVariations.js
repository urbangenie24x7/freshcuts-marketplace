// Migration script to handle product variations with numeric IDs
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore')

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
 * Generate variation ID
 * @param {string} productId - Product numeric ID (P1001)
 * @param {number} variationNumber - Variation number (1, 2, 3)
 * @returns {string} - Variation ID (P1001V01)
 */
function generateVariationId(productId, variationNumber) {
  const variationSuffix = `V${variationNumber.toString().padStart(2, '0')}`
  return `${productId}${variationSuffix}`
}

/**
 * Migrate product variations to numeric IDs
 */
async function migrateProductVariations() {
  console.log('🔄 Starting Product Variations Migration...')
  console.log('=' .repeat(60))
  
  try {
    const productsSnap = await getDocs(collection(db, 'products'))
    let totalProducts = 0
    let productsWithVariations = 0
    let totalVariationsProcessed = 0
    let errors = 0
    
    for (const productDoc of productsSnap.docs) {
      try {
        const productData = productDoc.data()
        totalProducts++
        
        // Skip if no variations or no numeric ID
        if (!productData.variations || !Array.isArray(productData.variations) || !productData.numericId) {
          console.log(`⏭️  Product ${productDoc.id} (${productData.name || 'Unknown'}) - No variations or numeric ID`)
          continue
        }
        
        const productNumericId = productData.numericId
        const updatedVariations = []
        
        console.log(`\n🔄 Processing ${productData.name || 'Unknown'} (${productNumericId})`)
        console.log(`   Found ${productData.variations.length} variations`)
        
        // Process each variation
        productData.variations.forEach((variation, index) => {
          const variationNumber = index + 1
          const variationId = generateVariationId(productNumericId, variationNumber)
          
          const updatedVariation = {
            ...variation,
            variationId,
            variationNumber,
            originalId: variation.id // Keep original ID for reference
          }
          
          updatedVariations.push(updatedVariation)
          
          console.log(`   ✅ ${variation.name || `Variation ${variationNumber}`} -> ${variationId}`)
          totalVariationsProcessed++
        })
        
        // Update product with new variation structure
        await updateDoc(doc(db, 'products', productDoc.id), {
          variations: updatedVariations,
          updatedAt: new Date()
        })
        
        productsWithVariations++
        console.log(`   ✅ Updated product ${productNumericId} with ${updatedVariations.length} variations`)
        
      } catch (error) {
        console.error(`❌ Error processing product ${productDoc.id}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Product Variations Migration Complete:')
    console.log(`   📄 Total Products: ${totalProducts}`)
    console.log(`   ✅ Products with Variations: ${productsWithVariations}`)
    console.log(`   🔄 Total Variations Processed: ${totalVariationsProcessed}`)
    console.log(`   ❌ Errors: ${errors}`)
    
  } catch (error) {
    console.error('❌ Product variations migration failed:', error)
  }
}

/**
 * Show examples of new variation structure
 */
function showExamples() {
  console.log('\n📋 New Variation ID Structure:')
  console.log('   Product: P1001 (Chicken Breast)')
  console.log('   Variations:')
  console.log('     - P1001V01 (500g variant)')
  console.log('     - P1001V02 (1kg variant)')
  console.log('     - P1001V03 (2kg variant)')
  console.log('')
  console.log('   Product: P1002 (Mutton Curry Cut)')
  console.log('   Variations:')
  console.log('     - P1002V01 (250g variant)')
  console.log('     - P1002V02 (500g variant)')
  console.log('')
}

/**
 * Main migration function
 */
async function runVariationMigration() {
  console.log('🚀 Starting Product Variations Migration')
  showExamples()
  
  await migrateProductVariations()
  
  console.log('\n🎉 Variation Migration completed!')
  console.log('\n📋 Next steps:')
  console.log('1. Verify variations in Firebase Console')
  console.log('2. Update frontend to use variationId')
  console.log('3. Create vendor-product relationships')
  console.log('4. Generate composite IDs (V1001P1001V01)')
}

// Run migration
runVariationMigration().catch(console.error)