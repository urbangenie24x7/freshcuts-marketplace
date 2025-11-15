import Head from 'next/head'

export default function SEOHead({ 
  title = "FreshCuts - Fresh Meat Marketplace",
  description = "Buy fresh meat from local vendors. Premium quality chicken, mutton, fish, prawns and more with free delivery.",
  image = "/icon.svg",
  url = "https://freshcuts.urbangenie24x7.com",
  type = "website",
  structuredData = null
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* PWA Meta Tags */}
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#16a34a" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="FreshCuts" />
      <link rel="apple-touch-icon" href="/icon-192.png" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="FreshCuts" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}