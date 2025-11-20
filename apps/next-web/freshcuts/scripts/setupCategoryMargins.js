// Setup admin-controlled category margins
const { initializeApp } = require('firebase/app')
const { getFirestore, doc, setDoc } = require('firebase/firestore')

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
 * Setup category margins controlled by admin
 */
async function setupCategoryMargins() {
  console.log('⚙️  Setting up Admin Category Margins')
  console.log('=' .repeat(60))
  
  try {
    // Define category margins (admin controlled)
    const categoryMargins = {
      'Chicken': {
        marginPercentage: 15, // 15% margin
        description: 'Fresh chicken products',
        active: true
      },
      'Mutton': {
        marginPercentage: 18, // 18% margin
        description: 'Fresh mutton products',
        active: true
      },
      'Fish': {
        marginPercentage: 20, // 20% margin
        description: 'Fresh fish and seafood',
        active: true
      },
      'Eggs': {
        marginPercentage: 12, // 12% margin
        description: 'Fresh eggs',
        active: true
      },
      'Prawns': {
        marginPercentage: 25, // 25% margin
        description: 'Fresh prawns and shrimp',
        active: true
      },
      'Premium Chicken': {
        marginPercentage: 20, // 20% margin
        description: 'Premium chicken varieties',
        active: true
      }
    }
    
    console.log('📊 Creating category margin settings...')
    
    for (const [category, settings] of Object.entries(categoryMargins)) {
      const marginData = {
        category: category,
        marginPercentage: settings.marginPercentage,
        description: settings.description,
        active: settings.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      }
      
      await setDoc(doc(db, 'categoryMargins', category.toLowerCase().replace(/\s+/g, '-')), marginData)
      
      console.log(`   ✅ ${category}: ${settings.marginPercentage}% margin`)
    }
    
    console.log('\n📋 Pricing Structure:')
    console.log('   Vendor Price: ₹100 (set by vendor)')
    console.log('   Category Margin: 15% (set by admin)')
    console.log('   Customer Price: ₹115 (vendor price + margin)')
    
    console.log('\n✅ Category margins setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up category margins:', error)
  }
}

// Run setup
setupCategoryMargins().catch(console.error)