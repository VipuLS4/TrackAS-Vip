import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState({ companies: [], operators: [], vehicles: [] });
  const [shipments, setShipments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data
      const dashboardRes = await fetch('/api/admin?action=dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const dashboardData = await dashboardRes.json();
      if (dashboardData.success) {
        setStats(dashboardData.data.stats);
        setPendingApprovals(dashboardData.data.pendingApprovals);
      }

      // Fetch shipments
      const shipmentsRes = await fetch('/api/shipments?action=list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 20 }),
      });
      const shipmentsData = await shipmentsRes.json();
      if (shipmentsData.success) {
        setShipments(shipmentsData.data.shipments);
      }

      // Fetch payments as payouts
      const paymentsRes = await fetch('/api/payments?action=list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'pending', limit: 20 }),
      });
      const paymentsData = await paymentsRes.json();
      if (paymentsData.success) {
        setPayouts(paymentsData.data.payments);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (type, id, action) => {
    try {
      const response = await fetch('/api/admin?action=approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          approvalId: id,
          action: action,
          adminNotes: `${action} by admin`
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDashboardData();
        alert(`${type} ${action}d successfully!`);
      } else {
        alert(`Failed to ${action} ${type}`);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error processing approval');
    }
  };

  const releasePayout = async (paymentId) => {
    try {
      const response = await fetch('/api/payments?action=release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentId: paymentId
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDashboardData();
        alert('Payout released successfully!');
      } else {
        alert('Failed to release payout');
      }
    } catch (error) {
      console.error('Error releasing payout:', error);
      alert('Error releasing payout');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'picked_up': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'out_for_delivery': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'escrowed': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">TrackAS Administration Panel</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Companies</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCompanies || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Drivers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOperators || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Shipments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalShipments || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Companies */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Companies ({pendingApprovals.companies?.length || 0})</h3>
            </div>
            <div className="p-6">
              {pendingApprovals.companies?.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.companies.map((company) => (
                    <div key={company.id} className="border rounded-lg p-4">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.email}</div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => handleApproval('company', company.id, 'approve')}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval('company', company.id, 'reject')}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pending companies</p>
              )}
            </div>
          </div>

          {/* Pending Drivers */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Drivers ({pendingApprovals.operators?.length || 0})</h3>
            </div>
            <div className="p-6">
              {pendingApprovals.operators?.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.operators.map((operator) => (
                    <div key={operator.id} className="border rounded-lg p-4">
                      <div className="font-medium">{operator.name}</div>
                      <div className="text-sm text-gray-500">{operator.mobile}</div>
                      <div className="text-sm text-gray-500">License: {operator.license_no}</div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => handleApproval('operator', operator.id, 'approve')}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval('operator', operator.id, 'reject')}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pending drivers</p>
              )}
            </div>
          </div>

          {/* Pending Vehicles */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Vehicles ({pendingApprovals.vehicles?.length || 0})</h3>
            </div>
            <div className="p-6">
              {pendingApprovals.vehicles?.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border rounded-lg p-4">
                      <div className="font-medium">{vehicle.type}</div>
                      <div className="text-sm text-gray-500">{vehicle.reg_no}</div>
                      <div className="text-sm text-gray-500">Capacity: {vehicle.capacity_weight}kg</div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => handleApproval('vehicle', vehicle.id, 'approve')}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval('vehicle', vehicle.id, 'reject')}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pending vehicles</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Shipments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shipments.slice(0, 10).map((shipment) => (
                  <tr key={shipment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{shipment.pickupAddress}</div>
                        <div className="text-gray-500">→ {shipment.deliveryAddress}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.companyId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.driverId || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{shipment.value?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payouts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Payouts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payout.payeeId || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">Shipment {payout.trackingId}</div>
                        <div className="text-gray-500">{payout.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{payout.amount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {payout.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => releasePayout(payout.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
