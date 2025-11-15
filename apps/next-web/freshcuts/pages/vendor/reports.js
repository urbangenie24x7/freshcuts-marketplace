import { useState, useEffect } from 'react'
import Head from 'next/head'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function VendorReports() {
  const [currentVendor, setCurrentVendor] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.role === 'vendor') {
        setCurrentVendor(user)
        loadVendorReport(user.id)
      } else {
        window.location.href = '/vendor/login'
      }
    } else {
      window.location.href = '/vendor/login'
    }
  }, [dateRange])

  const loadVendorReport = async (vendorId) => {
    setLoading(true)
    try {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      
      const [ordersSnap, refundsSnap, claimsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'orders'),
          where('vendorId', '==', vendorId),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        )),
        getDocs(query(
          collection(db, 'refunds'),
          where('vendorId', '==', vendorId),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        )),
        getDocs(query(
          collection(db, 'claims'),
          where('vendorId', '==', vendorId),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        ))
      ])

      let totalRevenue = 0
      let totalOrders = 0
      let deliveredOrders = 0
      let cancelledOrders = 0
      const productSales = {}
      const dailySales = {}

      ordersSnap.docs.forEach(doc => {
        const order = doc.data()
        const date = order.createdAt?.toDate?.()?.toDateString() || 'unknown'
        
        totalOrders += 1
        if (order.status === 'delivered') {
          totalRevenue += order.subtotal || 0
          deliveredOrders += 1
        } else if (order.status === 'cancelled') {
          cancelledOrders += 1
        }

        dailySales[date] = (dailySales[date] || 0) + (order.subtotal || 0)

        order.items?.forEach(item => {
          const productName = item.name || 'Unknown'
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0 }
          }
          productSales[productName].quantity += item.quantity
          productSales[productName].revenue += item.price * item.quantity
        })
      })

      let totalRefunds = 0
      refundsSnap.docs.forEach(doc => {
        const refund = doc.data()
        if (refund.status === 'approved') {
          totalRefunds += refund.amount || 0
        }
      })

      let totalClaims = 0
      let approvedClaims = 0
      claimsSnap.docs.forEach(doc => {
        const claim = doc.data()
        totalClaims += 1
        if (claim.status === 'approved') {
          approvedClaims += claim.compensationAmount || 0
        }
      })

      const netRevenue = totalRevenue - totalRefunds
      const platformCommission = netRevenue * 0.15
      const netEarnings = netRevenue - platformCommission + approvedClaims

      setReportData({
        totalRevenue,
        totalRefunds,
        netRevenue,
        platformCommission,
        netEarnings,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        avgOrderValue: deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0,
        productSales,
        dailySales,
        totalClaims,
        approvedClaims
      })
    } catch (error) {
      console.error('Error loading vendor report:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`

  return (
    <>
      <Head>
        <title>Vendor Reports - FreshCuts</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
              <div className="flex space-x-4">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading report...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Net Earnings</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.netEarnings)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                  <p className="text-2xl font-bold text-purple-600">{reportData.totalOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Avg Order Value</h3>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.avgOrderValue)}</p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Gross Revenue:</span>
                      <span className="font-medium text-green-600">{formatCurrency(reportData.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refunds:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(reportData.totalRefunds)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Revenue:</span>
                      <span className="font-medium">{formatCurrency(reportData.netRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Commission (15%):</span>
                      <span className="font-medium text-red-600">-{formatCurrency(reportData.platformCommission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Claims Compensation:</span>
                      <span className="font-medium text-green-600">+{formatCurrency(reportData.approvedClaims)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net Earnings:</span>
                      <span className="text-blue-600">{formatCurrency(reportData.netEarnings)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Delivered Orders:</span>
                      <span className="font-medium text-green-600">{reportData.deliveredOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled Orders:</span>
                      <span className="font-medium text-red-600">{reportData.cancelledOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">
                        {reportData.totalOrders > 0 ? ((reportData.deliveredOrders / reportData.totalOrders) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.productSales || {})
                      .sort(([,a], [,b]) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map(([product, data]) => (
                        <div key={product} className="flex justify-between">
                          <span className="truncate">{product}</span>
                          <span className="font-medium">{formatCurrency(data.revenue)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales (Last 7 Days)</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.dailySales || {})
                      .slice(-7)
                      .map(([date, amount]) => (
                        <div key={date} className="flex justify-between">
                          <span>{new Date(date).toLocaleDateString()}</span>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}