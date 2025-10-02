import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DriverDashboard() {
  const [shipments, setShipments] = useState([]);
  const [availableShipments, setAvailableShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [online, setOnline] = useState(false);
  const router = useRouter();
  
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/driver/login');
      return;
    }
    
    fetchUserData();
    fetchShipments();
    fetchAvailableShipments();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth?action=profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        setOnline(data.data.user.status === 'active');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchShipments = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('/api/shipments?action=list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          driverId: userData.id,
          limit: 50 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShipments(data.data.shipments);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableShipments = async () => {
    try {
      const response = await fetch('/api/shipments?action=list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'pending',
          limit: 20 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAvailableShipments(data.data.shipments);
      }
    } catch (error) {
      console.error('Error fetching available shipments:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      setOnline(!online);
      if (!online) {
        fetchAvailableShipments();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const acceptShipment = async (shipmentId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('/api/shipments?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          trackingId: shipmentId,
          driverId: userData.id,
          status: 'picked_up'
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchShipments();
        fetchAvailableShipments();
        alert('Shipment accepted successfully!');
      } else {
        alert('Failed to accept shipment');
      }
    } catch (error) {
      console.error('Error accepting shipment:', error);
      alert('Error accepting shipment');
    }
  };

  const updateShipmentStatus = async (trackingId, status) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('/api/shipments?action=update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          trackingId,
          status,
          location: 'Current Location',
          description: `Status updated to ${status}`,
          driverId: userData.id
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchShipments();
        alert(`Status updated to ${status}`);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'picked_up': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'out_for_delivery': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              {user && <p className="text-gray-600">Welcome, {user.name}</p>}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Status:</span>
                <button
                  onClick={toggleOnlineStatus}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    online 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {online ? 'Online' : 'Offline'}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">My Shipments</p>
                <p className="text-2xl font-semibold text-gray-900">{shipments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shipments.filter(s => s.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{availableShipments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Shipments */}
        {online && availableShipments.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Available Shipments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableShipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{shipment.pickupAddress}</div>
                          <div className="text-gray-500">→ {shipment.deliveryAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shipment.weight} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{shipment.value?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => acceptShipment(shipment.trackingId)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* My Shipments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">My Shipments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{shipment.pickupAddress}</div>
                        <div className="text-gray-500">→ {shipment.deliveryAddress}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{shipment.value?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {shipment.status === 'picked_up' && (
                        <button
                          onClick={() => updateShipmentStatus(shipment.trackingId, 'in_transit')}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Start Transit
                        </button>
                      )}
                      {shipment.status === 'in_transit' && (
                        <button
                          onClick={() => updateShipmentStatus(shipment.trackingId, 'out_for_delivery')}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Out for Delivery
                        </button>
                      )}
                      {shipment.status === 'out_for_delivery' && (
                        <button
                          onClick={() => updateShipmentStatus(shipment.trackingId, 'delivered')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Mark Delivered
                        </button>
                      )}
                      <a
                        href={`/track/${shipment.trackingId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Track
                      </a>
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
