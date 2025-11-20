import { CartProvider } from '../lib/CartContext'
import FloatingCart from '../components/FloatingCart'
import '../styles/globals.css'

export const metadata = {
  title: 'FreshCuts - Fresh Meat Delivery',
  description: 'Premium fresh meat delivery marketplace'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <FloatingCart />
        </CartProvider>
      </body>
    </html>
  )
}