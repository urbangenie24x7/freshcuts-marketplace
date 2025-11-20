const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function getAdminPhones() {
  try {
    console.log('Fetching admin users...')
    
    const usersRef = collection(db, 'users')
    const adminQuery = query(usersRef, where('role', 'in', ['admin', 'super_admin']))
    const snapshot = await getDocs(adminQuery)
    
    if (snapshot.empty) {
      console.log('No admin users found. Checking all users...')
      const allUsersSnapshot = await getDocs(usersRef)
      allUsersSnapshot.forEach(doc => {
        const data = doc.data()
        console.log(`User: ${data.name || 'N/A'} | Phone: ${data.phone || 'N/A'} | Role: ${data.role || 'N/A'}`)
      })
    } else {
      console.log('Admin users found:')
      snapshot.forEach(doc => {
        const data = doc.data()
        console.log(`Admin: ${data.name || 'N/A'} | Phone: ${data.phone || 'N/A'} | Role: ${data.role}`)
      })
    }
  } catch (error) {
    console.error('Error fetching admin phones:', error)
  }
}

getAdminPhones()