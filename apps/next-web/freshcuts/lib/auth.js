// Authentication utilities - Firebase only
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('currentUser')
  if (!userStr) return null
  
  try {
    const user = JSON.parse(userStr)
    // Ensure user has required Firebase fields
    if (!user.id || !user.phone || !user.role) {
      localStorage.removeItem('currentUser')
      return null
    }
    return user
  } catch {
    localStorage.removeItem('currentUser')
    return null
  }
}

export const logout = () => {
  if (typeof window !== 'undefined') {
    const user = getCurrentUser()
    localStorage.removeItem('currentUser')
    
    // Redirect based on user role
    if (user?.role === 'vendor') {
      window.location.href = '/vendor/login'
    } else if (user?.role === 'admin' || user?.role === 'super_admin') {
      window.location.href = '/admin/login'
    } else {
      window.location.href = '/customer/marketplace'
    }
  }
}

export const requireAuth = (allowedRoles = []) => {
  const user = getCurrentUser()
  
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/customer/login'
    }
    return null
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (typeof window !== 'undefined') {
      window.location.href = '/customer/login'
    }
    return null
  }
  
  return user
}

export const hasVerticalAccess = (user, vertical) => {
  if (!user) return false
  if (user.role === 'super_admin') return true
  if (user.role === 'admin') return user.verticals?.includes(vertical)
  if (user.role === 'vendor') return user.verticals?.includes(vertical)
  return false
}