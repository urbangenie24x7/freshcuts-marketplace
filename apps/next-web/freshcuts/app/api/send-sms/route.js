import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { phone, message } = await request.json()
    
    // Mock SMS sending
    console.log(`SMS to ${phone}: ${message}`)
    
    return NextResponse.json({ success: true, message: 'SMS sent successfully' })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}