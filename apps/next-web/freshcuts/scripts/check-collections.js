const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs } = require('firebase/firestore')

const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkCollections() {
  const collections = ['vendorApplications', 'vendorDelivery', 'vendorProducts', 'vendors']
  
  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName))
      console.log(`\n=== ${collectionName} ===`)
      console.log(`Documents: ${snapshot.docs.length}`)
      
      if (snapshot.docs.length > 0) {
        const sample = snapshot.docs[0].data()
        console.log('Sample document structure:')
        console.log(JSON.stringify(sample, null, 2))
      } else {
        console.log('No documents found')
      }
    } catch (error) {
      console.error(`Error checking ${collectionName}:`, error.message)
    }
  }
}

checkCollections().catch(console.error)