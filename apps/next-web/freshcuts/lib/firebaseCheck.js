// Firebase connection validation
export const checkFirebaseConnection = async () => {
  try {
    // Check if environment variables exist
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      throw new Error('Firebase API key not configured in environment variables')
    }
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Firebase project ID not configured in environment variables')
    }
    
    const { db } = await import('./firebase')
    const { collection, getDocs, limit, query } = await import('firebase/firestore')
    
    if (!db) {
      throw new Error('Firebase database not initialized')
    }
    
    // Test connection with a simple query
    const testQuery = query(collection(db, 'settings'), limit(1))
    await getDocs(testQuery)
    
    return { connected: true, error: null }
  } catch (error) {
    console.error('Firebase connection failed:', error)
    return { 
      connected: false, 
      error: error.message || 'Firebase connection failed'
    }
  }
}

export const requireFirebase = async () => {
  const { connected, error } = await checkFirebaseConnection()
  if (!connected) {
    throw new Error(`Firebase required: ${error}`)
  }
  return true
}