import crypto from 'crypto'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = crypto.randomBytes(32).toString('hex')
    
    // Store token in session or database for verification
    res.setHeader('Set-Cookie', `csrf-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`)
    
    res.status(200).json({ token })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate CSRF token' })
  }
}