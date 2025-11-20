// Migration script to add readable IDs to existing vendors and products
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { generateVendorId, generateProductId, generateUniqueReadableId } from '../lib/idUtils.js'

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
 * Add readable IDs to vendors
 */
async function migrateVendors() {
  console.log('🔄 Starting vendor migration...')
  
  try {
    const vendorsSnap = await getDocs(collection(db, 'vendors'))
    let processed = 0
    let errors = 0
    
    for (const vendorDoc of vendorsSnap.docs) {
      try {
        const vendorData = vendorDoc.data()
        
        // Skip if already has readable ID
        if (vendorData.readableId) {
          console.log(`⏭️  Vendor ${vendorDoc.id} already has readable ID: ${vendorData.readableId}`)
          continue
        }
        
        const businessName = vendorData.businessName || vendorData.name || vendorData.vendorName || `Vendor-${vendorDoc.id.slice(0, 8)}`
        const baseReadableId = generateVendorId(businessName)
        const uniqueReadableId = await generateUniqueReadableId('vendors', baseReadableId)
        
        // Update vendor document
        await updateDoc(doc(db, 'vendors', vendorDoc.id), {
          readableId: uniqueReadableId,
          slug: uniqueReadableId.replace('ven-', ''),
          updatedAt: new Date()
        })
        
        console.log(`✅ Updated vendor ${vendorDoc.id}: ${businessName} -> ${uniqueReadableId}`)
        processed++
        
      } catch (error) {
        console.error(`❌ Error updating vendor ${vendorDoc.id}:`, error)
        errors++
      }
    }
    
    console.log(`\n📊 Vendor Migration Complete:`)
    console.log(`   ✅ Processed: ${processed}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📄 Total: ${vendorsSnap.docs.length}`)
    
  } catch (error) {
    console.error('❌ Vendor migration failed:', error)
  }
}

/**
 * Add readable IDs to products
 */
async function migrateProducts() {
  console.log('\n🔄 Starting product migration...')
  
  try {
    const productsSnap = await getDocs(collection(db, 'products'))
    let processed = 0
    let errors = 0
    
    for (const productDoc of productsSnap.docs) {
      try {
        const productData = productDoc.data()
        
        // Skip if already has readable ID
        if (productData.readableId) {
          console.log(`⏭️  Product ${productDoc.id} already has readable ID: ${productData.readableId}`)
          continue
        }
        
        const productName = productData.name || `Product-${productDoc.id.slice(0, 8)}`
        const category = productData.category || ''
        const baseReadableId = generateProductId(productName, category)
        const uniqueReadableId = await generateUniqueReadableId('products', baseReadableId)
        
        // Update product document
        await updateDoc(doc(db, 'products', productDoc.id), {
          readableId: uniqueReadableId,
          slug: uniqueReadableId.replace('prd-', ''),
          updatedAt: new Date()
        })
        
        console.log(`✅ Updated product ${productDoc.id}: ${productName} -> ${uniqueReadableId}`)
        processed++
        
      } catch (error) {
        console.error(`❌ Error updating product ${productDoc.id}:`, error)
        errors++
      }
    }
    
    console.log(`\n📊 Product Migration Complete:`)
    console.log(`   ✅ Processed: ${processed}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📄 Total: ${productsSnap.docs.length}`)
    
  } catch (error) {
    console.error('❌ Product migration failed:', error)
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Readable ID Migration\n')
  console.log('=' .repeat(50))
  
  await migrateVendors()
  await migrateProducts()
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Migration completed!')
  console.log('\nNext steps:')
  console.log('1. Update your queries to use readableId where needed')
  console.log('2. Update URLs to use readable IDs')
  console.log('3. Add readable ID validation to forms')
}

// Run migration
runMigration().catch(console.error)