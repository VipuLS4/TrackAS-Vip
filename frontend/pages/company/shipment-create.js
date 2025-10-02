import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CreateShipment() {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    weight: '',
    dimensions: '',
    description: '',
    value: '',
    estimatedDelivery: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/company/login');
      return;
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const shipmentData = {
        ...formData,
        companyId: userData.id,
        weight: parseFloat(formData.weight) || 0,
        value: parseFloat(formData.value) || 0,
        estimatedDelivery: formData.estimatedDelivery || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await fetch('/api/shipments?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Shipment created successfully! Tracking ID: ${data.data.shipment.trackingId}`);
        setFormData({
          pickupAddress: '',
          deliveryAddress: '',
          weight: '',
          dimensions: '',
          description: '',
          value: '',
          estimatedDelivery: ''
        });
        setTimeout(() => {
          router.push('/company/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create shipment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/company/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
              <p className="text-gray-600">Fill in the details to create a new shipment</p>
            </div>
            <button
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Shipment Details</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Pickup Address */}
            <div>
              <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700">
                Pickup Address *
              </label>
              <textarea
                id="pickupAddress"
                name="pickupAddress"
                required
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter pickup address with city, state, and postal code"
                value={formData.pickupAddress}
                onChange={handleChange}
              />
            </div>

            {/* Delivery Address */}
            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700">
                Delivery Address *
              </label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                required
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter delivery address with city, state, and postal code"
                value={formData.deliveryAddress}
                onChange={handleChange}
              />
            </div>

            {/* Package Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">
                  Dimensions (L x W x H)
                </label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 30x20x15 cm"
                  value={formData.dimensions}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Package Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the package contents"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Value and Delivery Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Declared Value (₹)
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  value={formData.value}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-700">
                  Estimated Delivery Date
                </label>
                <input
                  type="datetime-local"
                  id="estimatedDelivery"
                  name="estimatedDelivery"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.estimatedDelivery}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Shipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}