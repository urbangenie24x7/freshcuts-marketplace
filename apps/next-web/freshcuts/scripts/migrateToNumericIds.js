// Migration script to add numeric IDs to existing data
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
 * Initialize counters
 */
async function initializeCounters() {
  console.log('🔄 Initializing counters...')
  
  try {
    await setDoc(doc(db, 'counters', 'vendors'), {
      current: 1000,
      prefix: 'V'
    })
    
    await setDoc(doc(db, 'counters', 'products'), {
      current: 1000,
      prefix: 'P'
    })
    
    await setDoc(doc(db, 'counters', 'customers'), {
      current: 100000,
      prefix: 'C'
    })
    
    console.log('✅ Counters initialized')
  } catch (error) {
    console.error('❌ Error initializing counters:', error)
  }
}

/**
 * Get next counter value
 */
async function getNextCounter(counterType) {
  const counterRef = doc(db, 'counters', counterType)
  const counterSnap = await getDocs(collection(db, 'counters'))
  
  let currentValue = 1000
  if (counterType === 'customers') currentValue = 100000
  
  for (const docSnap of counterSnap.docs) {
    if (docSnap.id === counterType) {
      currentValue = docSnap.data().current
      break
    }
  }
  
  const nextValue = currentValue + 1
  await updateDoc(counterRef, { current: nextValue })
  
  return nextValue
}

/**
 * Migrate vendors to numeric IDs
 */
async function migrateVendors() {
  console.log('\n🔄 Migrating vendors...')
  
  try {
    const vendorsSnap = await getDocs(collection(db, 'vendors'))
    let processed = 0
    let errors = 0
    
    for (const vendorDoc of vendorsSnap.docs) {
      try {
        const vendorData = vendorDoc.data()
        
        // Skip if already has numeric ID
        if (vendorData.numericId) {
          console.log(`⏭️  Vendor ${vendorDoc.id} already has numeric ID: ${vendorData.numericId}`)
          continue
        }
        
        const counter = await getNextCounter('vendors')
        const numericId = `V${counter}`
        
        await updateDoc(doc(db, 'vendors', vendorDoc.id), {
          numericId,
          updatedAt: new Date()
        })
        
        const businessName = vendorData.businessName || vendorData.name || 'Unknown'
        console.log(`✅ Updated vendor ${vendorDoc.id}: ${businessName} -> ${numericId}`)
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
 * Migrate products to numeric IDs
 */
async function migrateProducts() {
  console.log('\n🔄 Migrating products...')
  
  try {
    const productsSnap = await getDocs(collection(db, 'products'))
    let processed = 0
    let errors = 0
    
    for (const productDoc of productsSnap.docs) {
      try {
        const productData = productDoc.data()
        
        // Skip if already has numeric ID
        if (productData.numericId) {
          console.log(`⏭️  Product ${productDoc.id} already has numeric ID: ${productData.numericId}`)
          continue
        }
        
        const counter = await getNextCounter('products')
        const numericId = `P${counter}`
        
        await updateDoc(doc(db, 'products', productDoc.id), {
          numericId,
          updatedAt: new Date()
        })
        
        const productName = productData.name || 'Unknown'
        console.log(`✅ Updated product ${productDoc.id}: ${productName} -> ${numericId}`)
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
  console.log('🚀 Starting Numeric ID Migration')
  console.log('=' .repeat(60))
  console.log('\n📋 New ID Structure:')
  console.log('   Vendors: V1001, V1002, V1003...')
  console.log('   Products: P1001, P1002, P1003...')
  console.log('   Customers: C100001, C100002, C100003...')
  console.log('   Vendor Products: V1001P1001')
  console.log('   Variations: V1001P1001V01, V1001P1001V02...')
  console.log('\n' + '='.repeat(60))
  
  await initializeCounters()
  await migrateVendors()
  await migrateProducts()
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Migration completed!')
  console.log('\n📋 Next steps:')
  console.log('1. Update queries to use numericId field')
  console.log('2. Update URLs to use numeric IDs')
  console.log('3. Update forms to display numeric IDs')
}

// Run migration
runMigration().catch(console.error)