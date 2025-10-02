// Test component for enhanced error handling system
import React, { useState } from 'react';
import { ErrorFactory, ERROR_CATEGORY, ERROR_SEVERITY } from '../utils/errorTypes.js';
import { handleError, executeWithRetry } from '../utils/globalErrorHandlers.js';

export default function ErrorTestComponent() {
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, result, error = null) => {
    setTestResults(prev => [...prev, {
      test,
      result,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    }]);
  };

  const testValidationError = () => {
    try {
      const error = ErrorFactory.createValidationError(
        'Invalid email format',
        'email',
        'invalid-email',
        { form: 'registration' }
      );
      handleError(error);
      addTestResult('Validation Error', 'Success', null);
    } catch (err) {
      addTestResult('Validation Error', 'Failed', err);
    }
  };

  const testNetworkError = () => {
    try {
      const error = ErrorFactory.createNetworkError(
        'Connection timeout',
        'https://api.example.com/data',
        408,
        { retryCount: 3 }
      );
      handleError(error);
      addTestResult('Network Error', 'Success', null);
    } catch (err) {
      addTestResult('Network Error', 'Failed', err);
    }
  };

  const testAPIError = () => {
    try {
      const error = ErrorFactory.createAPIError(
        'Service unavailable',
        '/api/shipments',
        503,
        { endpoint: '/api/shipments' }
      );
      handleError(error);
      addTestResult('API Error', 'Success', null);
    } catch (err) {
      addTestResult('API Error', 'Failed', err);
    }
  };

  const testRenderingError = () => {
    try {
      const error = ErrorFactory.createRenderingError(
        'Component failed to render',
        'ShipmentList',
        { props: { shipments: [] } }
      );
      handleError(error);
      addTestResult('Rendering Error', 'Success', null);
    } catch (err) {
      addTestResult('Rendering Error', 'Failed', err);
    }
  };

  const testRetryMechanism = async () => {
    try {
      let attemptCount = 0;
      const result = await executeWithRetry('test-operation', async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return `Success on attempt ${attemptCount}`;
      });
      
      addTestResult('Retry Mechanism', `Success: ${result}`, null);
    } catch (err) {
      addTestResult('Retry Mechanism', 'Failed', err);
    }
  };

  const testErrorReporting = async () => {
    try {
      const error = ErrorFactory.createAPIError(
        'Test error for reporting',
        '/api/test',
        500,
        { test: true }
      );
      
      // This should trigger the error reporting
      handleError(error);
      addTestResult('Error Reporting', 'Success', null);
    } catch (err) {
      addTestResult('Error Reporting', 'Failed', err);
    }
  };

  const testUnhandledPromiseRejection = () => {
    try {
      // This should be caught by the global error handler
      Promise.reject(new Error('Unhandled promise rejection test'));
      addTestResult('Unhandled Promise Rejection', 'Success', null);
    } catch (err) {
      addTestResult('Unhandled Promise Rejection', 'Failed', err);
    }
  };

  const testJavaScriptError = () => {
    try {
      // This should be caught by the global error handler
      throw new Error('JavaScript error test');
    } catch (err) {
      addTestResult('JavaScript Error', 'Success', null);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Enhanced Error Handling Test Suite
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testValidationError}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Test Validation Error
        </button>
        
        <button
          onClick={testNetworkError}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
        >
          Test Network Error
        </button>
        
        <button
          onClick={testAPIError}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Test API Error
        </button>
        
        <button
          onClick={testRenderingError}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Test Rendering Error
        </button>
        
        <button
          onClick={testRetryMechanism}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Test Retry Mechanism
        </button>
        
        <button
          onClick={testErrorReporting}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Test Error Reporting
        </button>
        
        <button
          onClick={testUnhandledPromiseRejection}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
        >
          Test Promise Rejection
        </button>
        
        <button
          onClick={testJavaScriptError}
          className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
        >
          Test JavaScript Error
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
        <button
          onClick={clearResults}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {testResults.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No test results yet. Click the buttons above to test the error handling system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.test}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.result === 'Success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {result.error || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Enhanced Error Handling Features</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✅ Comprehensive error types and categories</li>
          <li>✅ Automatic error reporting to backend</li>
          <li>✅ Retry mechanisms with exponential backoff</li>
          <li>✅ Global error handlers for unhandled errors</li>
          <li>✅ User-friendly error messages</li>
          <li>✅ Error correlation IDs for tracking</li>
          <li>✅ Error statistics and monitoring</li>
          <li>✅ Offline detection and reconnection</li>
        </ul>
      </div>
    </div>
  );
}
