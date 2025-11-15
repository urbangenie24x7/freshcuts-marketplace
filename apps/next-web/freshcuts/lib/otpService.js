import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const sendOTP = async (phone) => {
  console.log('🧪 Using fallback OTP for testing: 123456')
  console.log(`📱 Phone (clean format): ${phone}`)
  // In production, this would send SMS to +91${phone}
  return { success: true, otp: '123456' }
}

export const verifyOTP = async (phone, otp) => {
  console.log(`🔍 Verifying OTP for phone: ${phone}, OTP: ${otp}`)
  if (otp === '123456') {
    console.log('✅ Fallback OTP verified successfully')
    return { success: true }
  }
  
  console.log('❌ OTP verification failed')
  return { success: false, error: 'Invalid OTP. Use 123456 for testing.' }
}