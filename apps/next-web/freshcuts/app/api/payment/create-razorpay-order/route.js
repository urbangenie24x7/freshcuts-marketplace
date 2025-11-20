import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { amount, currency = 'INR' } = await request.json()
    
    const order = {
      id: 'order_' + Math.random().toString(36).substr(2, 9),
      amount: amount * 100,
      currency,
      status: 'created'
    }
    
    return NextResponse.json({ success: true, order })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}