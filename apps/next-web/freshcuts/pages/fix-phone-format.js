import { useState } from 'react'

export default function FixPhoneFormat() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState('')

  const fixPhoneFormats = async () => {
    setLoading(true)
    setResults('Starting phone format migration...\n')

    try {
      const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')

      let updated = 0

      // Fix vendors
      const vendorsSnap = await getDocs(collection(db, 'vendors'))
      for (const vendorDoc of vendorsSnap.docs) {
        const data = vendorDoc.data()
        if (data.phone && data.phone.startsWith('+91')) {
          const cleanPhone = data.phone.replace('+91', '')
          await updateDoc(doc(db, 'vendors', vendorDoc.id), {
            phone: cleanPhone
          })
          setResults(prev => prev + `✅ Updated vendor ${data.name}: ${data.phone} → ${cleanPhone}\n`)
          updated++
        }
      }

      // Fix users
      const usersSnap = await getDocs(collection(db, 'users'))
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data()
        if (data.phone && data.phone.startsWith('+91')) {
          const cleanPhone = data.phone.replace('+91', '')
          await updateDoc(doc(db, 'users', userDoc.id), {
            phone: cleanPhone
          })
          setResults(prev => prev + `✅ Updated user ${data.name}: ${data.phone} → ${cleanPhone}\n`)
          updated++
        }
      }

      setResults(prev => prev + `\n🎉 Migration complete! Updated ${updated} records.`)
    } catch (error) {
      setResults(prev => prev + `\n❌ Error: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Fix Phone Format</h1>
      <p>This will update all phone numbers from +91XXXXXXXXXX to XXXXXXXXXX format.</p>
      
      <button
        onClick={fixPhoneFormats}
        disabled={loading}
        style={{
          backgroundColor: '#16a34a',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Fixing...' : 'Fix Phone Formats'}
      </button>

      {results && (
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '6px',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {results}
        </pre>
      )}
    </div>
  )
}