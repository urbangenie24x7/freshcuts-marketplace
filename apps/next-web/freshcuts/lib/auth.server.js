import { cookies } from 'next/headers'

export async function requireAuthServer(allowedRoles = []) {
  try {
    const cookieStore = cookies()
    const userCookie = cookieStore.get('currentUser')
    
    if (!userCookie?.value) return null
    
    const user = JSON.parse(userCookie.value)
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Auth server error:', error)
    return null
  }
}