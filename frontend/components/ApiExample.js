// Example component demonstrating proper API usage with error handling
import React, { useState, useEffect } from 'react';
import { useApiEndpoint, useHealthCheck } from '../hooks/useApi';
import apiClient from '../utils/apiClient';

export default function ApiExample() {
  const [manualData, setManualData] = useState(null);
  const [manualError, setManualError] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Using hooks for automatic API calls
  const { data: shipments, loading: shipmentsLoading, error: shipmentsError, execute: fetchShipments } = useApiEndpoint('/api/shipments', {
    immediate: true
  });

  const { isHealthy, loading: healthLoading, error: healthError, checkHealth } = useHealthCheck();

  // Manual API call example
  const handleManualApiCall = async () => {
    setManualLoading(true);
    setManualError(null);
    
    try {
      const result = await apiClient.get('/api/health');
      setManualData(result);
    } catch (error) {
      console.error('Manual API call failed:', error);
      setManualError(error.message);
    } finally {
      setManualLoading(false);
    }
  };

  // Test different error scenarios
  const testErrorScenarios = async () => {
    const scenarios = [
      { name: 'Valid endpoint', url: '/api/health' },
      { name: 'Invalid endpoint', url: '/api/invalid' },
      { name: 'Non-existent endpoint', url: '/api/nonexistent' }
    ];

    for (const scenario of scenarios) {
      try {
        console.log(`Testing: ${scenario.name}`);
        const result = await apiClient.get(scenario.url);
        console.log(`${scenario.name}: Success`, result);
      } catch (error) {
        console.log(`${scenario.name}: Error`, error.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        API Error Handling Examples
      </h1>

      {/* Health Check Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Health Check</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={checkHealth}
            disabled={healthLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {healthLoading ? 'Checking...' : 'Check Health'}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isHealthy === null ? 'bg-gray-400' : isHealthy ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isHealthy === null ? 'Unknown' : isHealthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
        </div>

        {healthError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">Health Check Error: {healthError}</p>
          </div>
        )}
      </div>

      {/* Shipments Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipments (Using Hooks)</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={fetchShipments}
            disabled={shipmentsLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {shipmentsLoading ? 'Loading...' : 'Fetch Shipments'}
          </button>
        </div>

        {shipmentsLoading && (
          <div className="text-gray-600">Loading shipments...</div>
        )}

        {shipmentsError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">Error: {shipmentsError}</p>
          </div>
        )}

        {shipments && (
          <div className="bg-gray-50 rounded-md p-3">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(shipments, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Manual API Call Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual API Call</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={handleManualApiCall}
            disabled={manualLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {manualLoading ? 'Loading...' : 'Make Manual API Call'}
          </button>
        </div>

        {manualError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">Error: {manualError}</p>
          </div>
        )}

        {manualData && (
          <div className="bg-gray-50 rounded-md p-3">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(manualData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Error Testing Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Testing</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={testErrorScenarios}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
          >
            Test Error Scenarios
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Click the button above to test different error scenarios. Check the browser console for detailed logs.
        </p>
      </div>

      {/* API Client Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">API Client Features</h2>
        
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✅ Automatic HTML response detection</li>
          <li>✅ Content-type validation</li>
          <li>✅ Network error handling</li>
          <li>✅ CORS error detection</li>
          <li>✅ Status code handling</li>
          <li>✅ Retry logic</li>
          <li>✅ User-friendly error messages</li>
          <li>✅ Detailed logging</li>
        </ul>
      </div>
    </div>
  );
}
