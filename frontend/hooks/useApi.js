// React hook for API calls with error handling
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      console.error('API Error:', err);
      
      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred';
      
      if (err.message.includes('HTML Response Error')) {
        errorMessage = 'Server returned an error page instead of data. Please try again.';
      } else if (err.message.includes('Network error')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.message.includes('CORS error')) {
        errorMessage = 'Server configuration error. Please contact support.';
      } else if (err.message.includes('API endpoint not found')) {
        errorMessage = 'The requested service is not available.';
      } else if (err.message.includes('Internal server error')) {
        errorMessage = 'Server is experiencing issues. Please try again later.';
      } else if (err.message.includes('Bad gateway')) {
        errorMessage = 'Server is not responding properly. Please try again.';
      } else if (err.message.includes('Service unavailable')) {
        errorMessage = 'Service is temporarily down. Please try again later.';
      } else if (err.message.includes('Gateway timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { makeRequest, loading, error, setError };
}

// Hook for specific API endpoints
export function useApiEndpoint(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { immediate = false, method = 'GET', body = null } = options;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      switch (method.toUpperCase()) {
        case 'GET':
          result = await apiClient.get(endpoint);
          break;
        case 'POST':
          result = await apiClient.post(endpoint, body);
          break;
        case 'PUT':
          result = await apiClient.put(endpoint, body);
          break;
        case 'DELETE':
          result = await apiClient.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      setData(result);
      return result;
    } catch (err) {
      console.error(`API Error for ${endpoint}:`, err);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (err.message.includes('HTML Response Error')) {
        errorMessage = 'Server returned an error page instead of data.';
      } else if (err.message.includes('Network error')) {
        errorMessage = 'Unable to connect to server.';
      } else if (err.message.includes('API endpoint not found')) {
        errorMessage = 'The requested service is not available.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, body]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setError };
}

// Hook for health check
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const health = await apiClient.healthCheck();
      setIsHealthy(health.status === 'OK');
      return health;
    } catch (err) {
      console.error('Health check failed:', err);
      setIsHealthy(false);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { isHealthy, loading, error, checkHealth };
}

// Hook for API connection test
export function useConnectionTest() {
  const [isConnected, setIsConnected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const connected = await apiClient.testConnection();
      setIsConnected(connected);
      return connected;
    } catch (err) {
      console.error('Connection test failed:', err);
      setIsConnected(false);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { isConnected, loading, error, testConnection };
}
