// Create test order for vendor order management
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc } = require('firebase/firestore')

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

async function createTestOrder() {
  try {
    console.log('Creating test order...')
    
    const testOrder = {
      vendorId: 'R2JrahdSzQ9vMqiDYQ1X', // Village Chicken Manikonda
      vendorName: 'Village Chicken Manikonda',
      customerId: 'test-customer-123',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+91 9876543210',
      items: [
        {
          id: 'V1013P1005',
          name: 'Chicken Breast (Boneless)',
          price: 98,
          quantity: 2,
          vendorId: 'V1013',
          productId: 'P1005'
        },
        {
          id: 'V1013P1014',
          name: 'Chicken Thighs',
          price: 108,
          quantity: 1,
          vendorId: 'V1013',
          productId: 'P1014'
        }
      ],
      subtotal: 304,
      deliveryFee: 30,
      total: 334,
      status: 'pending',
      deliveryOption: 'delivery',
      deliveryAddress: {
        address: '123 Test Street, Manikonda, Hyderabad',
        landmark: 'Near Test Mall',
        pincode: '500089',
        coordinates: {
          lat: 17.4065,
          lng: 78.4772
        }
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const docRef = await addDoc(collection(db, 'orders'), testOrder)
    console.log('Test order created with ID:', docRef.id)
    console.log('Order details:', {
      id: docRef.id,
      vendor: testOrder.vendorName,
      customer: testOrder.customerName,
      total: testOrder.total,
      items: testOrder.items.length,
      status: testOrder.status
    })
    
  } catch (error) {
    console.error('Error creating test order:', error)
  }
}

createTestOrder()