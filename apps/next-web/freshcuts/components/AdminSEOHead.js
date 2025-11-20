import Head from 'next/head'

export default function AdminSEOHead({ 
  title = "Admin Dashboard - FreshCuts",
  description = "Manage FreshCuts marketplace with comprehensive admin tools. Monitor vendors, process payments, handle disputes, and view analytics.",
  image = "/admin-icon-512.svg",
  url = "https://freshcuts.urbangenie24x7.com/admin/dashboard"
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Admin PWA Meta Tags */}
      <link rel="manifest" href="/admin-manifest.json" />
      <meta name="theme-color" content="#374151" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Admin Dashboard" />
      <link rel="apple-touch-icon" href="/Freshcuts_Mob_App_Icon_A.png" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="FreshCuts Admin" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  )
}