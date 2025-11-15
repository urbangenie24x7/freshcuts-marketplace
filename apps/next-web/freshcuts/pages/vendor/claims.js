import { useState, useEffect } from 'react'
import Head from 'next/head'
import { claimsService } from '../../lib/claimsService'

export default function VendorClaims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentVendor, setCurrentVendor] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newClaim, setNewClaim] = useState({
    orderId: '',
    type: 'no_show',
    reason: '',
    amount: 0
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.role === 'vendor') {
        setCurrentVendor(user)
        loadClaims(user.id)
      } else {
        window.location.href = '/vendor/login'
      }
    } else {
      window.location.href = '/vendor/login'
    }
  }, [])

  const loadClaims = async (vendorId) => {
    try {
      setLoading(true)
      const vendorClaims = await claimsService.getVendorClaims(vendorId)
      setClaims(vendorClaims)
    } catch (error) {
      console.error('Error loading claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitClaim = async () => {
    try {
      await claimsService.createClaim({
        ...newClaim,
        vendorId: currentVendor.id
      })
      setShowCreateForm(false)
      setNewClaim({ orderId: '', type: 'no_show', reason: '', amount: 0 })
      loadClaims(currentVendor.id)
      alert('Claim submitted successfully!')
    } catch (error) {
      console.error('Error submitting claim:', error)
      alert('Error submitting claim')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      no_show: 'Customer No-Show',
      late_cancellation: 'Late Cancellation',
      quality_issue: 'Quality Issue',
      other: 'Other'
    }
    return labels[type] || type
  }

  return (
    <>
      <Head>
        <title>Claims & Disputes - FreshCuts Vendor</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Claims & Disputes</h1>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                File New Claim
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Create Claim Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File New Claim</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                  <input
                    type="text"
                    value={newClaim.orderId}
                    onChange={(e) => setNewClaim({...newClaim, orderId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter order ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Claim Type</label>
                  <select
                    value={newClaim.type}
                    onChange={(e) => setNewClaim({...newClaim, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="no_show">Customer No-Show</option>
                    <option value="late_cancellation">Late Cancellation</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Claim Amount (₹)</label>
                  <input
                    type="number"
                    value={newClaim.amount}
                    onChange={(e) => setNewClaim({...newClaim, amount: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={newClaim.reason}
                  onChange={(e) => setNewClaim({...newClaim, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitClaim}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Submit Claim
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Claims Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Claims</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading claims...</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No claims filed</h3>
                <p className="mt-1 text-sm text-gray-500">File a claim for disputes or issues with orders.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filed Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {claim.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTypeLabel(claim.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{claim.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {claim.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Claims Policy */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Claims Policy</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>Customer No-Show:</strong> ₹50 compensation if customer doesn't receive order</p>
              <p><strong>Late Cancellation:</strong> ₹30 compensation for cancellations within 30 minutes of delivery</p>
              <p><strong>Quality Issues:</strong> Case-by-case evaluation with evidence required</p>
              <p><strong>Processing Time:</strong> Claims are reviewed within 24-48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}