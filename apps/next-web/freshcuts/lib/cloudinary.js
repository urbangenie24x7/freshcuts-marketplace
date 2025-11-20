// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwxk3blcb'
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'freshcuts_categories'

export const uploadToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'freshcuts/categories')
  formData.append('resource_type', 'image')

  try {
    console.log('Uploading to:', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`)
    console.log('Upload preset:', CLOUDINARY_UPLOAD_PRESET)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    const data = await response.json()
    console.log('Cloudinary response:', data)
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed')
    }
    
    return data.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

// Product image upload to specific folder
export const uploadProductToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'freshcuts/products')
  formData.append('resource_type', 'image')

  try {
    console.log('Uploading product to:', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    const data = await response.json()
    console.log('Cloudinary product response:', data)
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Product upload failed')
    }
    
    return data.secure_url
  } catch (error) {
    console.error('Cloudinary product upload error:', error)
    throw error
  }
}

// Logo upload to specific folder
export const uploadLogoToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'Brandlogo')
  formData.append('folder', 'freshcuts/logos')
  formData.append('resource_type', 'image')

  try {
    console.log('Uploading logo to:', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    const data = await response.json()
    console.log('Cloudinary logo response:', data)
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Logo upload failed')
    }
    
    return data.secure_url
  } catch (error) {
    console.error('Cloudinary logo upload error:', error)
    throw error
  }
}

// Fallback: Convert image to base64 data URL
export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}