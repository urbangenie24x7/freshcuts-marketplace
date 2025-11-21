import { CartProvider } from '../lib/CartContext'
import FloatingCart from '../components/FloatingCart'
import PWAManifest from '../components/PWAManifest'
import '../styles/globals.css'

export const metadata = {
  title: 'FreshCuts - Fresh Meat Delivery',
  description: 'Premium fresh meat delivery marketplace'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FreshCuts" />
        <link rel="apple-touch-icon" href="/customer-icon-192.png" />
      </head>
      <body>
        <CartProvider>
          <PWAManifest />
          {children}
          <FloatingCart />
        </CartProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                })
              }
            `
          }}
        />
      </body>
    </html>
  )
}