// Enhanced API Client with Error Handling and Retry Mechanisms
// Comprehensive API client with circuit breakers, retry policies, and error handling

import { ErrorFactory, ErrorResponseFormatter, ERROR_CATEGORY } from './errorTypes.js';
import { executeWithRetry } from './globalErrorHandlers.js';

/**
 * API Client Configuration
 */
export class ApiClientConfig {
  constructor(options = {}) {
    this.baseURL = options.baseURL || process.env.NEXT_PUBLIC_API_URL || '';
    this.timeout = options.timeout || 30000;
    this.retryPolicy = options.retryPolicy || {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    };
    this.circuitBreaker = options.circuitBreaker || {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000
    };
    this.defaultHeaders = options.defaultHeaders || {
      'Content-Type': 'application/json'
    };
  }
}

/**
 * Enhanced API Client
 */
export class EnhancedApiClient {
  constructor(config = new ApiClientConfig()) {
    this.config = config;
    this.circuitBreakers = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Make HTTP request with error handling and retry
   */
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const requestOptions = this.buildRequestOptions(options);
    
    // Check circuit breaker
    if (!this.canMakeRequest(endpoint)) {
      throw ErrorFactory.createNetworkError(
        'Service temporarily unavailable',
        url,
        null,
        { circuitBreaker: 'open' }
      );
    }

    try {
      const response = await this.executeWithRetry(
        `api_${endpoint}`,
        () => this.makeRequest(url, requestOptions),
        { endpoint, url }
      );

      this.onSuccess(endpoint);
      return response;
    } catch (error) {
      this.onFailure(endpoint, error);
      throw this.handleApiError(error, endpoint, url);
    }
  }

  /**
   * Build full URL
   */
  buildURL(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const baseURL = this.config.baseURL.endsWith('/') 
      ? this.config.baseURL.slice(0, -1) 
      : this.config.baseURL;
    
    const cleanEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
    
    return `${baseURL}${cleanEndpoint}`;
  }

  /**
   * Build request options
   */
  buildRequestOptions(options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: { ...this.config.defaultHeaders },
      timeout: this.config.timeout
    };

    return {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
  }

  /**
   * Make actual HTTP request
   */
  async makeRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return await this.parseResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw ErrorFactory.createTimeoutError(
          'Request timeout',
          options.timeout,
          'api_request',
          { url }
        );
      }
      
      throw error;
    }
  }

  /**
   * Parse response
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  /**
   * Execute with retry
   */
  async executeWithRetry(operation, fn, context = {}) {
    return await executeWithRetry(operation, fn, context);
  }

  /**
   * Handle API errors
   */
  handleApiError(error, endpoint, url) {
    if (error.status >= 400 && error.status < 500) {
      return ErrorFactory.createAPIError(
        `Client error: ${error.message}`,
        endpoint,
        error.status,
        { url, originalError: error.message }
      );
    }
    
    if (error.status >= 500) {
      return ErrorFactory.createAPIError(
        `Server error: ${error.message}`,
        endpoint,
        error.status,
        { url, originalError: error.message }
      );
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return ErrorFactory.createNetworkError(
        'Network request failed',
        url,
        null,
        { originalError: error.message }
      );
    }
    
    return ErrorFactory.fromUnknownError(error, { endpoint, url });
  }

  /**
   * Check if circuit breaker allows request
   */
  canMakeRequest(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    if (!breaker) return true;

    if (breaker.state === 'CLOSED') return true;
    if (breaker.state === 'OPEN') {
      if (Date.now() > breaker.nextAttempt) {
        breaker.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    if (breaker.state === 'HALF_OPEN') return true;

    return false;
  }

  /**
   * Handle successful request
   */
  onSuccess(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    if (breaker) {
      breaker.failures = 0;
      if (breaker.state === 'HALF_OPEN') {
        breaker.successes++;
        if (breaker.successes >= this.config.circuitBreaker.successThreshold) {
          breaker.state = 'CLOSED';
          breaker.successes = 0;
        }
      }
    }
  }

  /**
   * Handle failed request
   */
  onFailure(endpoint, error) {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        nextAttempt: null
      });
    }

    const breaker = this.circuitBreakers.get(endpoint);
    breaker.failures++;
    
    if (breaker.failures >= this.config.circuitBreaker.failureThreshold) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = Date.now() + this.config.circuitBreaker.timeout;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return await this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return await this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return await this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return await this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * Upload file
   */
  async upload(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    return await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...options.headers
      }
    });
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.config.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    delete this.config.defaultHeaders['Authorization'];
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(endpoint) {
    return this.circuitBreakers.get(endpoint) || null;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(endpoint) {
    if (this.circuitBreakers.has(endpoint)) {
      const breaker = this.circuitBreakers.get(endpoint);
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      breaker.successes = 0;
      breaker.nextAttempt = null;
    }
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllCircuitBreakerStatuses() {
    const statuses = {};
    for (const [endpoint, breaker] of this.circuitBreakers) {
      statuses[endpoint] = { ...breaker };
    }
    return statuses;
  }
}

// Create default instance
export const apiClient = new EnhancedApiClient();

// Export convenience functions
export function createApiClient(config) {
  return new EnhancedApiClient(config);
}

export function setApiBaseURL(baseURL) {
  apiClient.config.baseURL = baseURL;
}

export function setApiAuthToken(token) {
  apiClient.setAuthToken(token);
}

export function removeApiAuthToken() {
  apiClient.removeAuthToken();
}

export default apiClient;
