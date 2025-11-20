// Check orders in database
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore')

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

async function checkOrders() {
  try {
    console.log('=== Checking Orders ===\n')
    
    // Check all orders
    const allOrdersSnap = await getDocs(collection(db, 'orders'))
    console.log('Total orders in database:', allOrdersSnap.size)
    
    if (allOrdersSnap.size > 0) {
      console.log('\nAll orders:')
      allOrdersSnap.docs.forEach(doc => {
        const data = doc.data()
        console.log({
          id: doc.id,
          vendorId: data.vendorId,
          customerName: data.customerName,
          total: data.total,
          status: data.status,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        })
      })
    }
    
    // Check orders for specific vendor
    const vendorId = 'R2JrahdSzQ9vMqiDYQ1X'
    console.log(`\n=== Orders for vendor ${vendorId} ===`)
    
    const vendorOrdersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId)
    )
    const vendorOrdersSnap = await getDocs(vendorOrdersQuery)
    
    console.log('Orders for this vendor:', vendorOrdersSnap.size)
    
    if (vendorOrdersSnap.size > 0) {
      vendorOrdersSnap.docs.forEach(doc => {
        const data = doc.data()
        console.log({
          id: doc.id,
          customerName: data.customerName,
          total: data.total,
          status: data.status,
          items: data.items?.length || 0
        })
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkOrders()