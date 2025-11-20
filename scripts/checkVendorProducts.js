// Test script to check vendor products data
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore')

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

async function checkVendorProducts() {
  try {
    console.log('=== Checking Vendor Products Data ===\n')
    
    // Check the specific vendor from URL
    const vendorId = 'R2JrahdSzQ9vMqiDYQ1X'
    console.log('1. Checking vendor:', vendorId)
    
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId))
    if (vendorDoc.exists()) {
      const vendorData = vendorDoc.data()
      console.log('Vendor found:', {
        id: vendorDoc.id,
        name: vendorData.businessName || vendorData.name,
        numericId: vendorData.numericId,
        categories: vendorData.categories
      })
      
      // Check vendorProducts collection
      console.log('\n2. Checking vendorProducts collection...')
      const vendorProductsQuery = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendorData.numericId || vendorId)
      )
      const vendorProductsSnap = await getDocs(vendorProductsQuery)
      
      if (vendorProductsSnap.empty) {
        console.log('No vendor products found for vendorId:', vendorData.numericId || vendorId)
        
        // Check if there are any vendor products at all
        console.log('\n3. Checking all vendorProducts...')
        const allVendorProductsSnap = await getDocs(collection(db, 'vendorProducts'))
        console.log('Total vendorProducts in collection:', allVendorProductsSnap.size)
        
        if (!allVendorProductsSnap.empty) {
          console.log('Sample vendorProducts:')
          allVendorProductsSnap.docs.slice(0, 3).forEach(doc => {
            const data = doc.data()
            console.log({
              id: doc.id,
              vendorId: data.vendorId,
              productId: data.productId,
              productName: data.productName,
              category: data.category
            })
          })
        }
      } else {
        console.log('Found', vendorProductsSnap.size, 'vendor products:')
        vendorProductsSnap.docs.forEach(doc => {
          const data = doc.data()
          console.log({
            id: doc.id,
            vendorId: data.vendorId,
            productId: data.productId,
            productName: data.productName,
            category: data.category,
            finalPrice: data.finalPrice
          })
        })
      }
    } else {
      console.log('Vendor not found!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkVendorProducts()