import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
    
    // Mock verification
    const isValid = razorpay_payment_id && razorpay_order_id && razorpay_signature
    
    return NextResponse.json({ success: isValid, verified: isValid })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}