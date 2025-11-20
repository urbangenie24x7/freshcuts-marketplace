// Script to fix product-vendor relationships
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
 * Analyze current data structure
 */
async function analyzeData() {
  console.log('🔍 Analyzing current data structure...')
  console.log('=' .repeat(60))
  
  try {
    const [vendorsSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, 'vendors')),
      getDocs(collection(db, 'products'))
    ])
    
    const vendors = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    console.log(`📊 Data Summary:`)
    console.log(`   Vendors: ${vendors.length}`)
    console.log(`   Products: ${products.length}`)
    
    // Check vendors with numeric IDs
    const vendorsWithNumericId = vendors.filter(v => v.numericId)
    console.log(`   Vendors with numeric ID: ${vendorsWithNumericId.length}`)
    
    // Check products with vendor links
    const productsWithVendorId = products.filter(p => p.vendorId)
    console.log(`   Products with vendorId: ${productsWithVendorId.length}`)
    
    console.log('\n📋 Sample Vendors:')
    vendors.slice(0, 3).forEach(vendor => {
      console.log(`   ${vendor.numericId || 'NO_ID'} - ${vendor.businessName || vendor.name || 'Unknown'}`)
    })
    
    console.log('\n📋 Sample Products:')
    products.slice(0, 3).forEach(product => {
      console.log(`   ${product.numericId || 'NO_ID'} - ${product.name} (Vendor: ${product.vendorId || 'NONE'})`)
    })
    
    return { vendors, products, vendorsWithNumericId }
    
  } catch (error) {
    console.error('❌ Error analyzing data:', error)
    return null
  }
}

/**
 * Assign products to vendors (simple round-robin for demo)
 */
async function assignProductsToVendors() {
  console.log('\n🔄 Assigning products to vendors...')
  console.log('=' .repeat(60))
  
  try {
    const analysis = await analyzeData()
    if (!analysis) return
    
    const { vendors, products, vendorsWithNumericId } = analysis
    
    if (vendorsWithNumericId.length === 0) {
      console.log('❌ No vendors with numeric IDs found. Run vendor migration first.')
      return
    }
    
    let assigned = 0
    let errors = 0
    
    // Simple assignment: distribute products evenly among vendors
    for (let i = 0; i < products.length; i++) {
      try {
        const product = products[i]
        
        // Skip if already has vendor
        if (product.vendorId) {
          console.log(`⏭️  Product ${product.name} already has vendor: ${product.vendorId}`)
          continue
        }
        
        // Assign vendor in round-robin fashion
        const vendorIndex = i % vendorsWithNumericId.length
        const assignedVendor = vendorsWithNumericId[vendorIndex]
        
        await updateDoc(doc(db, 'products', product.id), {
          vendorId: assignedVendor.id, // Use Firebase ID for now
          vendorNumericId: assignedVendor.numericId,
          vendorName: assignedVendor.businessName || assignedVendor.name,
          updatedAt: new Date()
        })
        
        console.log(`✅ Assigned ${product.name} -> ${assignedVendor.businessName || assignedVendor.name} (${assignedVendor.numericId})`)
        assigned++
        
      } catch (error) {
        console.error(`❌ Error assigning product ${products[i].name}:`, error)
        errors++
      }
    }
    
    console.log('\n📊 Assignment Complete:')
    console.log(`   ✅ Products assigned: ${assigned}`)
    console.log(`   ❌ Errors: ${errors}`)
    
  } catch (error) {
    console.error('❌ Assignment failed:', error)
  }
}

/**
 * Main function
 */
async function runFix() {
  console.log('🚀 Fixing Product-Vendor Relationships')
  
  await analyzeData()
  
  console.log('\n❓ This will assign products to vendors randomly.')
  console.log('   In production, you should assign based on business logic.')
  console.log('   Continue? (This is just for demo purposes)')
  
  await assignProductsToVendors()
  
  console.log('\n🎉 Fix completed!')
  console.log('\n📋 Next step: Run vendor-product relationship script again')
}

// Run fix
runFix().catch(console.error)