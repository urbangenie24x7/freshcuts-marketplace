'use client'

import { useState, useEffect } from 'react'
import Navigation from '../../../components/Navigation'
import { requireAuth } from '../../../lib/auth'

export default function AdminVendorApplications() {
  const [mounted, setMounted] = useState(false)
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    const user = requireAuth(['admin', 'super_admin'])
    if (!user) return
    setMounted(true)
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      const applicationsSnap = await getDocs(collection(db, 'vendorApplications'))
      setApplications(applicationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const { updateDoc, doc, addDoc, collection } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase.client')
      
      await updateDoc(doc(db, 'vendorApplications', applicationId), {
        status,
        updatedAt: new Date()
      })
      
      if (status === 'approved') {
        const application = applications.find(app => app.id === applicationId)
        await addDoc(collection(db, 'vendors'), {
          name: application.businessName,
          phone: application.phone,
          email: application.email,
          address: application.address,
          products: application.products || [],
          status: 'active',
          createdAt: new Date()
        })
      }
      
      loadApplications()
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  )

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0' }}>Vendor Applications</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredApplications.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>No {filter === 'all' ? '' : filter} applications found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredApplications.map(application => (
              <div key={application.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>{application.businessName}</h3>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                      Applied: {application.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: 
                      application.status === 'approved' ? '#dcfce7' :
                      application.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color:
                      application.status === 'approved' ? '#166534' :
                      application.status === 'rejected' ? '#991b1b' : '#92400e'
                  }}>
                    {application.status || 'pending'}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <p style={{ margin: '5px 0', color: '#6b7280' }}>Owner: {application.ownerName}</p>
                    <p style={{ margin: '5px 0', color: '#6b7280' }}>Phone: {application.phone}</p>
                    <p style={{ margin: '5px 0', color: '#6b7280' }}>Email: {application.email}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', color: '#6b7280' }}>Business Type: {application.businessType}</p>
                    <p style={{ margin: '5px 0', color: '#6b7280' }}>Experience: {application.experience} years</p>
                    <p style={{ margin: '5px 0', color: '#6b7280' }}>Products: {application.products?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Address: {application.address}</p>
                  {application.description && (
                    <p style={{ margin: '10px 0', color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>
                      "{application.description}"
                    </p>
                  )}
                </div>

                {application.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'approved')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'rejected')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}