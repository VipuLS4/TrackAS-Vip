import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TrackShipment() {
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { trackingId } = router.query;

  useEffect(() => {
    if (trackingId) {
      fetchShipmentData();
    }
  }, [trackingId]);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tracking?trackingId=${trackingId}`);
      const data = await response.json();

      if (data.success) {
        setShipment(data.data.shipment);
        setEvents(data.data.events);
      } else {
        setError(data.message || 'Shipment not found');
      }
    } catch (err) {
      setError('Failed to fetch shipment data');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'picked_up': '📦',
      'in_transit': '🚚',
      'out_for_delivery': '🚛',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '❓';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shipment Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Shipment</h1>
              <p className="text-gray-600">Tracking ID: {trackingId}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
              {getStatusIcon(shipment.status)} {shipment.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${shipment.progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>0%</span>
            <span className="font-medium">{shipment.progressPercentage}% Complete</span>
            <span>100%</span>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pickup Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pickup Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Address:</span> {shipment.pickupAddress}</p>
              <p><span className="font-medium">Date:</span> {new Date(shipment.pickupDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Weight:</span> {shipment.weight} kg</p>
              <p><span className="font-medium">Dimensions:</span> {shipment.dimensions}</p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Address:</span> {shipment.deliveryAddress}</p>
              <p><span className="font-medium">Estimated:</span> {new Date(shipment.estimatedDelivery).toLocaleDateString()}</p>
              {shipment.actualDelivery && (
                <p><span className="font-medium">Delivered:</span> {new Date(shipment.actualDelivery).toLocaleDateString()}</p>
              )}
              <p><span className="font-medium">Description:</span> {shipment.description}</p>
            </div>
          </div>
        </div>

        {/* Current Location */}
        {shipment.currentLocation && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Location</h3>
            <div className="flex items-center">
              <div className="text-2xl mr-3">📍</div>
              <div>
                <p className="font-medium text-gray-900">{shipment.currentLocation}</p>
                <p className="text-sm text-gray-600">
                  {shipment.hoursRemaining > 0 
                    ? `Estimated delivery in ${shipment.hoursRemaining} hours`
                    : 'Delivery completed'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking Timeline</h3>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.status.replace('_', ' ').toUpperCase()}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  {event.location && (
                    <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-4"
          >
            Track Another Shipment
          </button>
          <button
            onClick={fetchShipmentData}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

