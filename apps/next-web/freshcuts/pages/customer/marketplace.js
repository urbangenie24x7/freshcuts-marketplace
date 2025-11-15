import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useCart } from '../../lib/CartContext'
import SEOHead from '../../components/SEOHead'
import { getCurrentLocation, calculateDistance, reverseGeocode } from '../../lib/locationService'

export default function CustomerMarketplace() {
  const { addToCart, getCartCount } = useCart()
  const [mounted, setMounted] = useState(false)
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [vendorProducts, setVendorProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showVendors, setShowVendors] = useState(false)
  const [marginPercentage, setMarginPercentage] = useState(15)
  const [selectedVariations, setSelectedVariations] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [bannerAds, setBannerAds] = useState([])
  const [categoryCards, setCategoryCards] = useState({})
  const [brandLogo, setBrandLogo] = useState('')
  const [logoHeight, setLogoHeight] = useState(40)
  const [landingCategoryCardsPerRow, setLandingCategoryCardsPerRow] = useState(6)
  const [productsPerRow, setProductsPerRow] = useState(4)
  const [isMobile, setIsMobile] = useState(false)
  const [filteredVendors, setFilteredVendors] = useState([])
  const [recommendedVendor, setRecommendedVendor] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationPermission, setLocationPermission] = useState('prompt')
  const [userAddress, setUserAddress] = useState('')
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    loadData()
    requestLocation()
    
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
    
    // Handle responsive design
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    // Cleanup real-time listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const loadData = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      console.log('Loading fresh data from Firebase...')
      
      // Load margin settings
      const settingsSnap = await getDocs(collection(db, 'settings'))
      if (settingsSnap.docs.length > 0) {
        setMarginPercentage(settingsSnap.docs[0].data().marginPercentage || 15)
      }
      
      // Load vendors
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      setVendors(vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      
      // Load banner ads
      const bannerSnap = await getDocs(collection(db, 'bannerAds'))
      const ads = bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(ad => ad.active)
      setBannerAds(ads)
      
      // Load category cards
      const categorySnap = await getDocs(collection(db, 'categoryCards'))
      const cards = {}
      categorySnap.docs.forEach(doc => {
        const data = doc.data()
        console.log('Category card loaded:', data.categoryId, data)
        if (data.active) {
          cards[data.categoryId] = { id: doc.id, ...data }
        }
      })
      console.log('Final category cards:', cards)
      console.log('Category cards count:', Object.keys(cards).length)
      setCategoryCards(cards)
      
      // Load brand settings
      const brandSnap = await getDocs(collection(db, 'brandSettings'))
      if (brandSnap.docs.length > 0) {
        const brandData = brandSnap.docs[0].data()
        setBrandLogo(brandData.logo || '')
        setLogoHeight(brandData.logoHeight || 40)
        setLandingCategoryCardsPerRow(brandData.landingCategoryCardsPerRow || 3)
        setProductsPerRow(brandData.productsPerRow || 4)
        
        console.log('Layout settings loaded:', {
          landingCategoryCardsPerRow: brandData.landingCategoryCardsPerRow,
          productsPerRow: brandData.productsPerRow,
          actualValue: landingCategoryCardsPerRow
        })
      }
      
      // Force re-render by updating timestamp
      console.log('Category cards updated at:', new Date().toISOString())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadVendorProducts = async (vendorId) => {
    try {
      const { collection, getDocs, onSnapshot, query, where } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      // Get current margin settings
      const settingsSnap = await getDocs(collection(db, 'settings'))
      let currentMargin = 15
      if (settingsSnap.docs.length > 0) {
        currentMargin = settingsSnap.docs[0].data().marginPercentage || 15
      }
      
      // Get products once
      const productsSnap = await getDocs(collection(db, 'products'))
      const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Set up real-time listener for vendor products
      const vendorProductsQuery = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendorId)
      )
      
      const unsubscribe = onSnapshot(vendorProductsQuery, (snapshot) => {
        const vendorProducts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(vp => vp.available)
        
        // Combine vendor products with product details and calculate customer price
        const combinedProducts = vendorProducts.map(vp => {
          const product = products.find(p => p.id === vp.productId)
          const customerPrice = Math.round(vp.price * (1 + currentMargin / 100))
          
          // Use master product variations only (vendorVariations removed)
          const variations = product?.variations || null
          
          return {
            id: vp.id,
            name: product?.name || 'Unknown Product',
            category: product?.category || 'unknown',
            vendorPrice: vp.price,
            price: customerPrice,
            deliveryOptions: vp.deliveryOptions || {
              pickup: { available: true, charges: 0 },
              normal: { available: true, charges: 0, time: '3-4 hours', minOrderForFree: 0 },
              express: { available: false, charges: 50, time: '1 hour', minOrderForFree: 0 }
            },
            unit: product?.baseUnit || 'kg',
            available: vp.available && product?.available,
            imageUrl: product?.image_url ? `${product.image_url}?t=${Date.now()}` : 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop',
            variations: variations
          }
        })
        
        setVendorProducts(combinedProducts)
      })
      
      // Store unsubscribe function to clean up later
      return unsubscribe
    } catch (error) {
      console.error('Error loading vendor products:', error)
    }
  }

  const selectVendor = async (vendor) => {
    setSelectedVendor(vendor)
    const unsubscribe = await loadVendorProducts(vendor.id)
    
    // Store unsubscribe function for cleanup
    if (unsubscribe) {
      unsubscribeRef.current = unsubscribe
    }
  }

  const categories = ['all', 'chicken', 'country-chicken', 'mutton', 'fish', 'prawns', 'crabs']
  const categoryData = {
    chicken: { 
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=200&fit=crop&crop=center',
      name: 'Chicken', 
      description: 'Fresh poultry from local farms'
    },
    'country-chicken': { 
      image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&h=200&fit=crop&crop=center',
      name: 'Country Chicken', 
      description: 'Free-range country chicken'
    },
    mutton: { 
      image: 'https://images.unsplash.com/photo-1588347818133-38c4106ca7b4?w=300&h=200&fit=crop&crop=center',
      name: 'Mutton', 
      description: 'Premium mutton cuts'
    },
    fish: { 
      image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=300&h=200&fit=crop&crop=center',
      name: 'Fish', 
      description: 'Fresh fish from local waters'
    },
    prawns: { 
      image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&h=200&fit=crop&crop=center',
      name: 'Prawns', 
      description: 'Fresh prawns and shrimp'
    },
    crabs: { 
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop&crop=center',
      name: 'Crabs', 
      description: 'Live and fresh crabs'
    }
  }
  
  const getRandomDiscount = () => {
    const hasDiscount = Math.random() > 0.7
    return hasDiscount ? Math.floor(Math.random() * 20) + 5 : 0
  }
  
  const requestLocation = async () => {
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      setLocationPermission('granted')
      
      // Get address from coordinates
      try {
        const addressData = await reverseGeocode(location.lat, location.lng)
        setUserAddress(addressData.formatted_address)
      } catch (error) {
        console.log('Could not get address:', error.message)
      }
    } catch (error) {
      console.log('Location access denied or failed:', error.message)
      setLocationPermission('denied')
    }
  }

  const getVendorScore = async (vendor, category) => {
    // Calculate real distance if user location is available
    let distance = Math.floor(Math.random() * 3) + 1 // Fallback to simulated
    if (userLocation && vendor.location) {
      distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        vendor.location.lat, vendor.location.lng
      )
    }
    
    const rating = 4.2 + Math.random() * 0.7 // Simulated rating
    const categoryRelevance = vendor.categories?.includes(category) ? 1 : 0.5
    
    // Get actual product availability from database
    let productAvailability = 0.5 // Default fallback
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      const vendorProductsQuery = query(
        collection(db, 'vendorProducts'),
        where('vendorId', '==', vendor.id),
        where('available', '==', true)
      )
      
      const snapshot = await getDocs(vendorProductsQuery)
      const availableProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      if (category === 'all') {
        // For 'all' category, consider total available products
        productAvailability = Math.min(availableProducts.length / 10, 1) // Normalize to 0-1, max at 10 products
      } else {
        // For specific category, get products and check category match
        const productsSnap = await getDocs(collection(db, 'products'))
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        const categoryProducts = availableProducts.filter(vp => {
          const product = products.find(p => p.id === vp.productId)
          return product && product.category === category
        })
        
        productAvailability = Math.min(categoryProducts.length / 5, 1) // Normalize to 0-1, max at 5 products per category
      }
    } catch (error) {
      console.error('Error fetching product availability:', error)
      productAvailability = Math.random() > 0.2 ? 0.8 : 0.3 // Fallback to simulated availability
    }
    
    // Scoring algorithm: higher is better
    const distanceScore = Math.max(0, (5 - distance) / 5) // Closer = higher score (25%)
    const ratingScore = rating / 5 // Normalize to 0-1 (30%)
    const relevanceScore = categoryRelevance // Category match (25%)
    const availabilityScore = productAvailability // Actual product availability (20%)
    
    return (distanceScore * 0.25) + (ratingScore * 0.3) + (relevanceScore * 0.25) + (availabilityScore * 0.2)
  }

  useEffect(() => {
    const sortVendorsByScore = async () => {
      if (vendors.length === 0) return
      
      const vendorsToFilter = selectedCategory === 'all'
        ? vendors
        : vendors.filter(vendor => vendor.categories?.includes(selectedCategory))
      
      // Calculate scores for all vendors
      const vendorsWithScores = await Promise.all(
        vendorsToFilter.map(async (vendor) => {
          const score = await getVendorScore(vendor, selectedCategory)
          return { ...vendor, score }
        })
      )
      
      // Sort by score (highest first)
      const sortedVendors = vendorsWithScores.sort((a, b) => b.score - a.score)
      
      setFilteredVendors(sortedVendors)
      setRecommendedVendor(sortedVendors[0] || null)
    }
    
    sortVendorsByScore()
  }, [vendors, selectedCategory])

  if (!mounted) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center' }}>
        <h1 style={{ color: '#16a34a', fontSize: '32px', marginBottom: '20px' }}>FreshCuts</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>Loading...</p>
      </div>
    )
  }

  return (
    <>
      {selectedVendor ? (
        <SEOHead 
          title={`${selectedVendor.name} - Fresh Meat Vendor | FreshCuts`}
          description={`Buy fresh ${selectedVendor.categories?.join(', ')} from ${selectedVendor.name}. Premium quality meat with fast delivery. ${vendorProducts.length} products available.`}
          url={`https://freshcuts.urbangenie24x7.com/vendor/${selectedVendor.id}`}
          structuredData={{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": selectedVendor.name,
            "description": `Fresh meat vendor specializing in ${selectedVendor.categories?.join(', ')}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Local Area"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Fresh Meat Products",
              "itemListElement": vendorProducts.map(product => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": product.name,
                  "image": product.imageUrl,
                  "category": product.category
                },
                "price": product.price,
                "priceCurrency": "INR"
              }))
            }
          }}
        />
      ) : showVendors ? (
        <SEOHead 
          title={`${selectedCategory === 'all' ? 'All Categories' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Vendors | FreshCuts`}
          description={`Find local ${selectedCategory === 'all' ? 'meat' : selectedCategory} vendors near you. Fresh quality guaranteed with fast delivery. ${filteredVendors.length} vendors available.`}
          url={`https://freshcuts.urbangenie24x7.com/category/${selectedCategory}`}
        />
      ) : (
        <SEOHead 
          title="FreshCuts - Fresh Meat Marketplace | Local Vendors"
          description="Buy fresh meat from local vendors. Premium quality chicken, mutton, fish, prawns and more with free delivery. Support local businesses."
          url="https://freshcuts.urbangenie24x7.com"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "FreshCuts",
            "description": "Fresh meat marketplace connecting customers with local vendors",
            "url": "https://freshcuts.urbangenie24x7.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://freshcuts.urbangenie24x7.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }}
        />
      )}
      <Head>
        <style>{`
          @keyframes scroll-left {
            0% { transform: translate3d(100%, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
          .scrolling-text {
            animation: scroll-left 120s linear infinite;
          }
          @media (min-width: 769px) {
            .category-grid {
              grid-template-columns: repeat(${landingCategoryCardsPerRow}, 1fr) !important;
            }
          }
          @media (max-width: 768px) {
            .category-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .product-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 480px) {
            .category-grid {
              grid-template-columns: 1fr !important;
            }
            .product-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </Head>
      
      {/* Customer Navigation Bar */}
      <nav style={{
        backgroundColor: '#ffffff',
        padding: window.innerWidth <= 768 ? '8px 0' : '12px 20px',
        marginBottom: '0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: '0',
        zIndex: '100',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex-row" style={{
          maxWidth: isMobile ? '100%' : '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: isMobile ? '4px' : '10px',
          padding: isMobile ? '0 8px' : '0',
          minHeight: '48px',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
            <Link href="/" style={{ 
              color: '#16a34a', 
              textDecoration: 'none', 
              fontSize: '24px', 
              fontWeight: '700',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {brandLogo ? (
                <img 
                  src={brandLogo} 
                  alt="FreshCuts Logo"
                  style={{ 
                    height: isMobile ? `${Math.min(logoHeight * 0.6, 28)}px` : `${logoHeight}px`, 
                    objectFit: 'contain',
                    maxWidth: isMobile ? '100px' : '200px',
                    display: 'block',
                    verticalAlign: 'middle'
                  }}
                />
              ) : (
                isMobile ? 'FC' : 'FreshCuts'
              )}
            </Link>
            
            {/* Breadcrumb in same bar - Hide on tablet/mobile */}
            {(showVendors || selectedVendor) && window.innerWidth > 1024 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ color: '#d1d5db' }}>|</span>
                <span 
                  onClick={() => {
                    setSelectedVendor(null)
                    setShowVendors(false)
                    setSelectedCategory('all')
                  }}
                  style={{ 
                    cursor: 'pointer', 
                    color: (!selectedVendor && !showVendors) ? '#16a34a' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
                  </svg>
                  Home
                </span>
                <span>→</span>
                <span 
                  onClick={() => {
                    setSelectedVendor(null)
                    setShowVendors(true)
                  }}
                  style={{ 
                    cursor: 'pointer',
                    color: (showVendors && !selectedVendor) ? '#16a34a' : '#6b7280',
                    textTransform: 'capitalize',
                    fontWeight: '500'
                  }}
                >
                  {selectedCategory === 'all' ? 'All Categories' : selectedCategory} Vendors
                </span>
                {selectedVendor && (
                  <>
                    <span>→</span>
                    <span style={{ color: '#16a34a', fontWeight: '600' }}>
                      {selectedVendor.name}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {!isMobile && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
              <Link href="/customer/cart" title="Cart" style={{ color: '#374151', textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '6px', transition: 'all 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18C5.9 18 5 18.9 5 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5H5.21L4.27 3H1M17 18C15.9 18 15 18.9 15 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z"/>
                </svg>
                {getCartCount() > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {getCartCount()}
                  </span>
                )}
              </Link>
              {mounted && currentUser && (
                <>
                  <Link href="/customer/orders" title="Orders" style={{ color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,3C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19H5V5H12V3H5M17.78,4C17.61,4 17.43,4.07 17.3,4.2L16.08,5.41L18.58,7.91L19.8,6.7C20.06,6.44 20.06,6 19.8,5.75L18.25,4.2C18.12,4.07 17.95,4 17.78,4M15.37,6.12L8,13.5V16H10.5L17.87,8.62L15.37,6.12Z"/>
                    </svg>
                  </Link>
                  <Link href="/customer/dashboard" title="Dashboard" style={{ color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11H11C9.9 11 9 10.1 9 9V7.5L3 7V9C3 10.1 3.9 11 5 11H7V20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20V11H19C20.1 11 21 10.1 21 9Z"/>
                    </svg>
                  </Link>
                  <button
                    title="Logout"
                    onClick={() => {
                      localStorage.removeItem('currentUser')
                      setCurrentUser(null)
                      window.location.reload()
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 17V14H9V10H16V7L21 12L16 17M14 2C15.11 2 16 2.9 16 4V6H14V4H5V20H14V18H16V20C16 21.11 15.11 22 14 22H5C3.9 22 3 21.11 3 20V4C3 2.9 3.9 2 5 2H14Z"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
      

      
      {/* Location Banner - Hidden on mobile */}
      {mounted && !isMobile && (
        <div style={{
          backgroundColor: userLocation ? '#f0f9ff' : '#fef3c7',
          borderBottom: '1px solid ' + (userLocation ? '#bae6fd' : '#fcd34d'),
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={userLocation ? '#0369a1' : '#92400e'}>
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            <span style={{
              fontSize: '14px',
              color: userLocation ? '#0369a1' : '#92400e',
              fontWeight: '500'
            }}>
              {userLocation ? 
                `📍 ${userAddress || 'Location detected'}` : 
                locationPermission === 'denied' ? 
                  '📍 Location access denied - showing all vendors' :
                  '📍 Detecting location for better recommendations...'
              }
            </span>
          </div>
          
          {!userLocation && locationPermission !== 'denied' && (
            <button
              onClick={requestLocation}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Enable Location
            </button>
          )}
        </div>
      )}
      
      {/* Multi-Vendor Info Banner */}
      {!selectedVendor && !showVendors && (
        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '12px 20px',
          textAlign: 'center',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          margin: '0 auto 20px',
          maxWidth: '1200px'
        }}>
          <span style={{ color: '#1e40af', fontSize: '14px', fontWeight: '500' }}>
            🛒 Shop from multiple vendors in one order • Compare prices • Single checkout
          </span>
        </div>
      )}
      
      <div className="container" style={{ padding: isMobile ? '20px 16px' : '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>

      {selectedVendor && (
        <>
          {/* Vendor Details Section */}
          <div style={{ 
            background: 'white',
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {/* Vendor Avatar */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: '700'
              }}>
                {selectedVendor.name.charAt(0)}
              </div>
              
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h1 style={{ color: '#1f2937', fontSize: '24px', fontWeight: '700', margin: '0' }}>
                    {selectedVendor.name}
                  </h1>
                  <div style={{
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Verified
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '13px', color: '#6b7280' }}>
                  <span>{Math.floor(Math.random() * 3) + 1}km away</span>
                  <span>•</span>
                  <span>{(4.2 + Math.random() * 0.7).toFixed(1)}/5.0 rating</span>
                  <span>•</span>
                  <span>30-45 min delivery</span>
                </div>
              </div>
              
              {/* Quality Promise - Compact */}
              <div style={{
                background: '#f0f9ff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
                minWidth: '180px'
              }}>
                <h4 style={{ color: '#0c4a6e', fontSize: '13px', margin: '0 0 6px 0', fontWeight: '600' }}>Quality Promise</h4>
                <div style={{ color: '#0c4a6e', fontSize: '11px', lineHeight: '1.4' }}>
                  ✓ Fresh daily sourcing<br/>
                  ✓ Hygienic processing<br/>
                  ✓ Temperature controlled
                </div>
              </div>
            </div>
            

          </div>
        </>
      )}

      {!selectedVendor && !showVendors && (
        <section style={{ marginBottom: '60px', marginTop: '40px' }}>
          {/* Elegant Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.03) 0%, rgba(21, 128, 61, 0.08) 100%)',
            padding: isMobile ? '40px 20px' : '60px 40px',
            borderRadius: '24px',
            marginBottom: '50px',
            border: '1px solid rgba(22, 163, 74, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(22, 163, 74, 0.05) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{
                fontSize: isMobile ? '32px' : '48px',
                fontWeight: '800',
                color: '#1f2937',
                marginBottom: '16px',
                letterSpacing: '-1px',
                lineHeight: '1.1'
              }}>
                Premium Fresh Meat
              </h1>
              <p style={{
                fontSize: isMobile ? '16px' : '20px',
                color: '#6b7280',
                marginBottom: '32px',
                fontWeight: '400',
                lineHeight: '1.6'
              }}>
                Discover quality cuts from trusted local vendors
              </p>
              <div style={{
                display: 'flex',
                gap: isMobile ? '16px' : '24px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                  </svg>
                  Fresh Daily
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
                  </svg>
                  Same Day Delivery
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                  </svg>
                  Local Vendors
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '20px' : '40px',
            marginBottom: '50px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>500+</div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Happy Customers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>50+</div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Local Vendors</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>4.8★</div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Average Rating</div>
            </div>
          </div>

          {/* Categories Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>
              Shop by Category
            </h2>
            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: '#6b7280',
              margin: '0',
              fontWeight: '400'
            }}>
              Choose from our premium selection of fresh meat
            </p>
          </div>

          <div 
            className="category-grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: !isMobile ? `repeat(${landingCategoryCardsPerRow}, 1fr)` : 'repeat(2, 1fr)',
              gap: !isMobile ? '12px' : '8px', 
              marginBottom: '20px',
              width: '100%'
            }}
            data-columns={landingCategoryCardsPerRow}
          >
            {Object.entries(categoryCards)
              .sort(([,a], [,b]) => (a.order || 0) - (b.order || 0))
              .map(([key, category]) => {
              return (
              <div 
                key={key}
                onClick={() => {
                  setSelectedCategory(key)
                  setShowVendors(true)
                }}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '24px',
                  padding: isMobile ? '20px 16px' : '24px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  minWidth: '0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-12px)'
                  e.currentTarget.style.borderColor = '#16a34a'
                  e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(22, 163, 74, 0.1)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                }}
              >
                <div style={{ 
                  width: '100%', 
                  height: !isMobile ? '160px' : '120px', 
                  marginBottom: !isMobile ? '20px' : '15px', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img 
                    src={category.image} 
                    alt={category.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      transition: 'transform 0.3s ease',
                      backgroundColor: '#f3f4f6'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />

                </div>
                <h3 style={{ color: '#1f2937', fontSize: !isMobile ? '22px' : '18px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>{category.name}</h3>
                <p style={{ color: '#6b7280', fontSize: !isMobile ? '15px' : '14px', margin: '0 0 8px 0', lineHeight: '1.6', fontWeight: '400' }}>{category.description}</p>
                <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                  Multiple vendors available
                </div>
              </div>
            )
            })}
          </div>

          {/* How It Works */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: isMobile ? '40px 20px' : '60px 40px',
            borderRadius: '24px',
            marginTop: '60px',
            border: '1px solid rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                How It Works
              </h2>
              <p style={{ fontSize: '16px', color: '#6b7280', margin: '0' }}>
                Simple steps to get fresh meat delivered to your door
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '30px' : '40px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#16a34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700'
                }}>1</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Choose Category</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0', lineHeight: '1.5' }}>Select from chicken, mutton, fish, and more premium categories</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#16a34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700'
                }}>2</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Select Vendor</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0', lineHeight: '1.5' }}>Browse trusted local vendors and their fresh products</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#16a34a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700'
                }}>3</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Get Delivered</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0', lineHeight: '1.5' }}>Enjoy same-day delivery of fresh meat to your doorstep</p>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 40px',
            marginTop: '40px'
          }}>
            <h2 style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              Ready to get started?
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '24px',
              maxWidth: '500px',
              margin: '0 auto 24px'
            }}>
              Join thousands of satisfied customers who trust us for their daily meat needs
            </p>
            <button
              onClick={() => {
                document.querySelector('.category-grid').scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#15803d'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#16a34a'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Start Shopping
            </button>
          </div>

          {/* Vendor Onboarding CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: isMobile ? '40px 20px' : '50px 40px',
            borderRadius: '20px',
            marginTop: '60px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              Are you a meat vendor?
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '24px',
              maxWidth: '600px',
              margin: '0 auto 24px'
            }}>
              Join our growing marketplace and reach thousands of customers. Grow your business with our platform.
            </p>
            <div style={{
              display: 'flex',
              gap: isMobile ? '12px' : '20px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                Zero setup fees
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                Easy product management
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
                Weekly payouts
              </div>
            </div>
            <button
              onClick={() => {
                window.location.href = '/vendor/onboarding'
              }}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(55, 65, 81, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1f2937'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#374151'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Become a Partner
            </button>
          </div>
        </section>
      )}

      {!selectedVendor && showVendors && (
        <section style={{ marginBottom: '60px' }}>
          {/* Category Hero */}
          <div style={{
            background: `linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(21, 128, 61, 0.1) 100%)`,
            padding: isMobile ? '30px 20px' : '40px 30px',
            borderRadius: '20px',
            marginBottom: '40px',
            border: '1px solid rgba(22, 163, 74, 0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px',
              textTransform: 'capitalize'
            }}>
              {selectedCategory === 'all' ? 'All Categories' : selectedCategory} Vendors
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '0',
              fontWeight: '400'
            }}>
              {filteredVendors.length} trusted vendors • Fresh daily • Same-day delivery
            </p>
          </div>

          {/* Recommended Vendor */}
          {recommendedVendor && filteredVendors.length > 1 && (
            <div style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              padding: isMobile ? '20px' : '24px',
              borderRadius: '16px',
              marginBottom: '30px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%'
              }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
                  </svg>
                  <span style={{ fontSize: '14px', fontWeight: '600', opacity: '0.9' }}>RECOMMENDED FOR YOU</span>
                </div>
                <h3 style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  {recommendedVendor.name}
                </h3>
                <p style={{
                  fontSize: '14px',
                  opacity: '0.9',
                  marginBottom: '16px',
                  margin: '0 0 16px 0'
                }}>
                  Best match based on distance, ratings, availability, and {selectedCategory} specialization
                </p>
                <button
                  onClick={() => selectVendor(recommendedVendor)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Shop Now →
                </button>
              </div>
            </div>
          )}

          {filteredVendors.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f9fafb',
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#9ca3af">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10A1.5,1.5 0 0,1 13.5,8.5A1.5,1.5 0 0,1 15,10V11.5A3.5,3.5 0 0,1 11.5,15H10.5V14A2.5,2.5 0 0,1 13,11.5V10A1.5,1.5 0 0,1 12,10Z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', color: '#374151', marginBottom: '8px', fontWeight: '600' }}>No vendors available</h3>
              <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>We're working to add more vendors in this category</p>
            </div>
          ) : (
            <div className="vendor-grid" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: isMobile ? '16px' : '24px'
            }}>
              {filteredVendors.map((vendor, index) => (
                <div 
                  key={vendor.id} 
                  onClick={() => selectVendor(vendor)}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: isMobile ? '20px' : '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = '#16a34a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {/* Vendor Avatar with Badge */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: index === 0 && filteredVendors.length > 1 ? '#fbbf24' : '#16a34a',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {(vendor.name || 'V').charAt(0).toUpperCase()}
                    </div>
                    {index === 0 && filteredVendors.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: '#fbbf24',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        ★
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{
                      color: '#1f2937',
                      fontSize: '20px',
                      fontWeight: '700',
                      margin: '0',
                      letterSpacing: '-0.3px'
                    }}>
                      {vendor.name || 'Unnamed Vendor'}
                    </h3>
                    {index === 0 && filteredVendors.length > 1 && (
                      <span style={{
                        backgroundColor: '#fbbf24',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        BEST MATCH
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                      </svg>
                      {(() => {
                        if (userLocation && vendor.location) {
                          const distance = calculateDistance(
                            userLocation.lat, userLocation.lng,
                            vendor.location.lat, vendor.location.lng
                          )
                          return `${distance.toFixed(1)}km away`
                        }
                        return `${Math.floor(Math.random() * 3) + 1}km away`
                      })()
                      }
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24">
                        <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
                      </svg>
                      {(4.2 + Math.random() * 0.7).toFixed(1)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                      </svg>
                      30-45 min
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginBottom: '20px'
                  }}>
                    {vendor.categories?.slice(0, 3).map(category => (
                      <span key={category} style={{
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                        color: '#16a34a',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {category}
                      </span>
                    ))}
                    {vendor.categories?.length > 3 && (
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        +{vendor.categories.length - 3} more
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      color: '#16a34a',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      Shop Now
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
                      </svg>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {Math.floor(Math.random() * 15) + 5} items
                      </div>
                      <div style={{
                        color: '#16a34a',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        Multi-vendor
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedVendor && (
        <section>
          {/* Category Filters */}
          <div style={{ 
            background: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Filter:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '6px 12px',
                  background: selectedCategory === 'all' ? '#16a34a' : '#f3f4f6',
                  color: selectedCategory === 'all' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                All
              </button>
              {selectedVendor.categories?.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '6px 12px',
                    background: selectedCategory === category ? '#16a34a' : '#f3f4f6',
                    color: selectedCategory === category ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', color: '#1f2937', margin: '0', fontWeight: '700' }}>
                  Products ({vendorProducts.filter(p => selectedCategory === 'all' || p.category === selectedCategory).length})
                </h2>
                <div style={{ 
                  backgroundColor: '#f0f9ff', 
                  color: '#0369a1',
                  padding: '4px 8px', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Free delivery ₹500+
                </div>
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e',
                  padding: '4px 8px', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Fresh daily
                </div>
              </div>
              
              <button
                onClick={() => loadVendorProducts(selectedVendor.id)}
                style={{
                  padding: '8px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Refresh
              </button>
            </div>
          </div>
          {vendorProducts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '10px' }}>No products available from this vendor</p>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Check back later for new products</p>
            </div>
          ) : (
            <div 
              className="product-grid" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth > 1024 ? `repeat(${Math.min(productsPerRow + 1, 6)}, 1fr)` : 
                                   window.innerWidth > 768 ? 'repeat(4, 1fr)' : 
                                   window.innerWidth > 480 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                gap: window.innerWidth > 768 ? '20px' : '15px',
                padding: '0'
              }}
            >
              {vendorProducts.filter(product => selectedCategory === 'all' || product.category === selectedCategory).map(product => {
                const discount = getRandomDiscount()
                const originalPrice = product.price
                const discountedPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice
                
                return (
                  <div key={product.id} style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    height: 'fit-content'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
                    e.currentTarget.style.borderColor = '#16a34a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}>
                    {discount > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}>
                        -{discount}% OFF
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={product.imageUrl}
                        alt={`Fresh ${product.name} - ${product.category} from ${selectedVendor.name}`}
                        style={{
                          width: '100%',
                          height: window.innerWidth > 768 ? '140px' : '120px',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      />
                      
                      {/* Add to Cart Icon */}
                      <button 
                        onClick={() => {
                          const selectedVariation = product.variations ? 
                            { ...product.variations[selectedVariations[product.id] || 0], index: selectedVariations[product.id] || 0 } : 
                            null
                          addToCart({ ...product, vendorId: selectedVendor.id, vendorName: selectedVendor.name }, selectedVariation)
                        }}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '36px',
                          height: '36px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          color: '#16a34a',
                          border: '1px solid rgba(22, 163, 74, 0.2)',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)'
                          e.target.style.background = 'linear-gradient(135deg, #16a34a, #15803d)'
                          e.target.style.color = 'white'
                          e.target.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)'
                          e.target.style.background = 'rgba(255, 255, 255, 0.95)'
                          e.target.style.color = '#16a34a'
                          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 18C5.9 18 5 18.9 5 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5H5.21L4.27 3H1M17 18C15.9 18 15 18.9 15 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z"/>
                        </svg>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: '#ef4444',
                          borderRadius: '50%',
                          padding: '1px'
                        }}>
                          <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                        </svg>
                      </button>
                      
                      {/* Category Badge */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: '#16a34a',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        textTransform: 'capitalize',
                        fontWeight: '600',
                        border: '1px solid rgba(22, 163, 74, 0.2)'
                      }}>
                        {product.category}
                      </div>
                    </div>
                    
                    {/* Product Content */}
                    <div style={{ padding: window.innerWidth > 768 ? '20px' : '16px' }}>
                      {/* Product Name */}
                      <div style={{ marginBottom: '12px' }}>
                        <Link href={`/product/${product.name.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: 'none' }}>
                          <h3 style={{ 
                            color: '#1f2937', 
                            margin: '0', 
                            fontSize: window.innerWidth > 768 ? '18px' : '16px', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            lineHeight: '1.3',
                            letterSpacing: '-0.3px'
                          }}>
                            {product.name}
                          </h3>
                        </Link>
                      </div>
                      
                      {/* Variations Selector */}
                      {product.variations && (
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ 
                            fontSize: '13px', 
                            color: '#6b7280', 
                            marginBottom: '6px', 
                            display: 'block', 
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {product.category === 'chicken' || product.category === 'mutton' ? 'Options' :
                             product.category === 'fish' ? 'Options' :
                             product.category === 'prawns' ? 'Options' :
                             product.category === 'eggs' ? 'Options' : 'Options'}
                          </label>
                          <select
                            value={selectedVariations[product.id] || 0}
                            onChange={(e) => setSelectedVariations({
                              ...selectedVariations,
                              [product.id]: parseInt(e.target.value)
                            })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              color: '#374151',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          >
                            {product.variations.map((variation, index) => {
                              const variationPrice = Math.round(product.price * variation.priceMultiplier)
                              const variationDiscountedPrice = discount > 0 ? Math.round(variationPrice * (1 - discount / 100)) : variationPrice
                              
                              return (
                                <option key={index} value={index}>
                                  {variation.name || `${variation.weight}${variation.unit} ${variation.cut}`} - ₹{discount > 0 ? variationDiscountedPrice : variationPrice}
                                </option>
                              )
                            })}
                          </select>
                        </div>
                      )}
                      
                      {/* Price Section */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                          {(() => {
                            if (product.variations) {
                              const selectedVariation = product.variations[selectedVariations[product.id] || 0]
                              const variationPrice = Math.round(product.price * selectedVariation.priceMultiplier)
                              const variationDiscountedPrice = discount > 0 ? Math.round(variationPrice * (1 - discount / 100)) : variationPrice
                              const unitText = `per ${selectedVariation.weight}${selectedVariation.unit}` || product.baseUnit || 'per unit'
                              return (
                                <>
                                  <span style={{ color: '#16a34a', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>₹{variationDiscountedPrice}</span>
                                  {discount > 0 && (
                                    <span style={{ color: '#9ca3af', fontSize: '16px', textDecoration: 'line-through', fontWeight: '500' }}>₹{variationPrice}</span>
                                  )}
                                  <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>{unitText}</span>
                                </>
                              )
                            } else {
                              return (
                                <>
                                  <span style={{ color: '#16a34a', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>₹{discountedPrice}</span>
                                  {discount > 0 && (
                                    <span style={{ color: '#9ca3af', fontSize: '16px', textDecoration: 'line-through', fontWeight: '500' }}>₹{originalPrice}</span>
                                  )}
                                  <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>per {product.baseUnit || 'kg'}</span>
                                </>
                              )
                            }
                          })()}
                        </div>
                      </div>
                      

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
      </div>
      
      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          padding: '8px 0',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <Link href="/customer/marketplace" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: window.location.pathname === '/customer/marketplace' ? '#16a34a' : '#6b7280',
              padding: '8px',
              minWidth: '60px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
              </svg>
              <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '500' }}>Home</span>
            </Link>
            
            <Link href="/customer/cart" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: window.location.pathname === '/customer/cart' ? '#16a34a' : '#6b7280',
              padding: '8px',
              minWidth: '60px',
              position: 'relative'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18C5.9 18 5 18.9 5 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5H5.21L4.27 3H1M17 18C15.9 18 15 18.9 15 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z"/>
              </svg>
              {getCartCount() > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {getCartCount()}
                </span>
              )}
              <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '500' }}>Cart</span>
            </Link>
            
            {mounted && currentUser && (
              <>
                <Link href="/customer/orders" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: window.location.pathname === '/customer/orders' ? '#16a34a' : '#6b7280',
                  padding: '8px',
                  minWidth: '60px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5,3C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19H5V5H12V3H5M17.78,4C17.61,4 17.43,4.07 17.3,4.2L16.08,5.41L18.58,7.91L19.8,6.7C20.06,6.44 20.06,6 19.8,5.75L18.25,4.2C18.12,4.07 17.95,4 17.78,4M15.37,6.12L8,13.5V16H10.5L17.87,8.62L15.37,6.12Z"/>
                  </svg>
                  <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '500' }}>Orders</span>
                </Link>
                
                <Link href="/customer/dashboard" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: window.location.pathname === '/customer/dashboard' ? '#16a34a' : '#6b7280',
                  padding: '8px',
                  minWidth: '60px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11H11C9.9 11 9 10.1 9 9V7.5L3 7V9C3 10.1 3.9 11 5 11H7V20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20V11H19C20.1 11 21 10.1 21 9Z"/>
                  </svg>
                  <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '500' }}>Profile</span>
                </Link>
              </>
            )}
            
            {mounted && !currentUser && (
              <button
                onClick={() => window.location.href = '/customer/marketplace'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  padding: '8px',
                  minWidth: '60px',
                  cursor: 'pointer'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11H11C9.9 11 9 10.1 9 9V7.5L3 7V9C3 10.1 3.9 11 5 11H7V20C7 21.1 7.9 22 9 22H15C16.1 22 17 21.1 17 20V11H19C20.1 11 21 10.1 21 9Z"/>
                </svg>
                <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '500' }}>Login</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}