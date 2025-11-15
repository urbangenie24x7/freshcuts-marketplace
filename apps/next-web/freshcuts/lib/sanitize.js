// Input sanitization utilities
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/[<>\"'&]/g, (match) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match]
    })
    .trim()
}

export const sanitizeHTML = (input) => {
  if (typeof input !== 'string') return ''
  
  // Remove all HTML tags and decode entities
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return ''
  
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '')
}

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return ''
  
  // Basic email sanitization
  return email.toLowerCase().trim()
}

export const validateAndSanitizeInput = (input, type = 'string') => {
  switch (type) {
    case 'string':
      return sanitizeString(input)
    case 'html':
      return sanitizeHTML(input)
    case 'phone':
      return sanitizePhone(input)
    case 'email':
      return sanitizeEmail(input)
    default:
      return sanitizeString(input)
  }
}