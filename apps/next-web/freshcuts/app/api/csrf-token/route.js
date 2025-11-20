import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const token = Math.random().toString(36).substr(2, 32)
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}