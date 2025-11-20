import Head from 'next/head'

export default function VendorSEOHead({ 
  title = "Vendor Dashboard - FreshCuts",
  description = "Manage your meat business with FreshCuts vendor dashboard. Track orders, manage products, and grow your earnings.",
  image = "/vendor-icon-512.svg",
  url = "https://freshcuts.urbangenie24x7.com/vendor/dashboard"
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Vendor PWA Meta Tags */}
      <link rel="manifest" href="/vendor-manifest.json" />
      <meta name="theme-color" content="#f59e0b" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Vendor Dashboard" />
      <link rel="apple-touch-icon" href="/Freshcuts_Mob_App_Icon_V.png" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="FreshCuts Vendor" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  )
}