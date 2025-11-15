import { CartProvider } from '../lib/CartContext'
import { registerSW } from '../lib/pwa'
import { useEffect } from 'react'
import '../styles/globals.css'
import '../styles/mobile.css'
import '../styles/responsive.css'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    registerSW()
  }, [])

  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  )
}