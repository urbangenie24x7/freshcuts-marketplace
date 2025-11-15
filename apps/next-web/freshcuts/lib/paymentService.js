// Payment Gateway Integration Service
class PaymentService {
  constructor() {
    this.razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    this.phonepeKey = process.env.NEXT_PUBLIC_PHONEPE_KEY
  }

  // Get CSRF token
  async getCSRFToken() {
    try {
      const response = await fetch('/api/csrf-token')
      const { token } = await response.json()
      return token
    } catch (error) {
      console.error('Error getting CSRF token:', error)
      return null
    }
  }

  // Initialize Razorpay
  async initializeRazorpay() {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Create Razorpay order
  async createRazorpayOrder(orderData) {
    try {
      const csrfToken = await this.getCSRFToken()
      const response = await fetch('/api/payment/create-razorpay-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          amount: orderData.amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            customerId: orderData.customerId,
            parentOrderId: orderData.parentOrderId
          }
        })
      })
      return await response.json()
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      throw error
    }
  }

  // Process Razorpay payment
  async processRazorpayPayment(orderData, onSuccess, onFailure) {
    try {
      const isLoaded = await this.initializeRazorpay()
      if (!isLoaded) throw new Error('Razorpay SDK failed to load')

      const razorpayOrder = await this.createRazorpayOrder(orderData)
      
      const options = {
        key: this.razorpayKey,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'FreshCuts',
        description: 'Fresh Meat Delivery',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verification = await this.verifyRazorpayPayment(response)
            if (verification.success) {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                method: 'razorpay'
              })
            } else {
              onFailure('Payment verification failed')
            }
          } catch (error) {
            onFailure(error.message)
          }
        },
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone
        },
        theme: {
          color: '#16a34a'
        },
        modal: {
          ondismiss: () => onFailure('Payment cancelled by user')
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      onFailure(error.message)
    }
  }

  // Verify Razorpay payment
  async verifyRazorpayPayment(paymentData) {
    try {
      const csrfToken = await this.getCSRFToken()
      const response = await fetch('/api/payment/verify-razorpay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(paymentData)
      })
      return await response.json()
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    }
  }

  // Generate UPI payment link
  generateUPILink(orderData) {
    const { amount, merchantId = 'freshcuts@upi', merchantName = 'FreshCuts' } = orderData
    const transactionId = `FC${Date.now()}`
    
    return {
      gpay: `upi://pay?pa=${merchantId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order Payment&tr=${transactionId}`,
      phonepe: `phonepe://pay?pa=${merchantId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order Payment&tr=${transactionId}`,
      paytm: `paytmmp://pay?pa=${merchantId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order Payment&tr=${transactionId}`,
      generic: `upi://pay?pa=${merchantId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order Payment&tr=${transactionId}`,
      transactionId
    }
  }

  // Process UPI payment
  async processUPIPayment(orderData, selectedApp, onSuccess, onFailure) {
    try {
      const upiLinks = this.generateUPILink(orderData)
      const link = upiLinks[selectedApp] || upiLinks.generic
      
      // Open UPI app
      window.location.href = link
      
      // Start payment verification polling
      const transactionId = upiLinks.transactionId
      this.startUPIVerification(transactionId, onSuccess, onFailure)
      
    } catch (error) {
      onFailure(error.message)
    }
  }

  // Start UPI payment verification polling
  startUPIVerification(transactionId, onSuccess, onFailure) {
    let attempts = 0
    const maxAttempts = 30 // 5 minutes with 10-second intervals
    
    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify-upi?transactionId=${transactionId}`)
        const result = await response.json()
        
        if (result.status === 'success') {
          onSuccess({
            transactionId,
            method: 'upi',
            paymentId: result.paymentId
          })
        } else if (result.status === 'failed') {
          onFailure('UPI payment failed')
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkPayment, 10000) // Check every 10 seconds
        } else {
          onFailure('Payment verification timeout')
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkPayment, 10000)
        } else {
          onFailure('Payment verification failed')
        }
      }
    }
    
    // Start checking after 5 seconds
    setTimeout(checkPayment, 5000)
  }

  // Process Cash on Delivery
  async processCODPayment(orderData, onSuccess) {
    try {
      // For COD, we just need to mark the order as pending payment
      onSuccess({
        method: 'cod',
        paymentId: `COD_${Date.now()}`,
        status: 'pending'
      })
    } catch (error) {
      throw error
    }
  }

  // Get available payment methods
  getAvailablePaymentMethods(orderAmount) {
    const methods = [
      {
        id: 'razorpay',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        icon: '💳',
        available: true, // Test account works without KYC
        processingFee: 0
      },
      {
        id: 'upi',
        name: 'UPI Payment',
        description: 'Pay with GPay, PhonePe, Paytm',
        icon: '📱',
        available: true,
        processingFee: 0
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive',
        icon: '💵',
        available: orderAmount <= 2000, // COD limit
        processingFee: orderAmount > 500 ? 25 : 0
      }
    ]
    
    return methods.filter(method => method.available)
  }

  // Save payment details to database
  async savePaymentDetails(paymentData) {
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      
      const paymentDoc = doc(db, 'payments', paymentData.paymentId)
      await setDoc(paymentDoc, {
        ...paymentData,
        createdAt: serverTimestamp(),
        status: paymentData.status || 'completed'
      })
      
      return true
    } catch (error) {
      console.error('Error saving payment details:', error)
      throw error
    }
  }
}

export default new PaymentService()