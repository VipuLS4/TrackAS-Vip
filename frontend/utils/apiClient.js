// Robust API client with HTML/JSON error handling
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  }

  // Helper method to check if response is HTML
  isHTMLResponse(response) {
    const contentType = response.headers.get('content-type');
    return contentType && contentType.includes('text/html');
  }

  // Helper method to check if response is JSON
  isJSONResponse(response) {
    const contentType = response.headers.get('content-type');
    return contentType && contentType.includes('application/json');
  }

  // Helper method to handle different response types
  async handleResponse(response) {
    try {
      // Check if response is HTML (error page)
      if (this.isHTMLResponse(response)) {
        const htmlText = await response.text();
        console.error('Received HTML instead of JSON:', htmlText);
        
        // Try to extract error message from HTML
        const errorMatch = htmlText.match(/<title>(.*?)<\/title>/i) || 
                          htmlText.match(/<h1>(.*?)<\/h1>/i) ||
                          htmlText.match(/error:?\s*(.*?)(?:<|$)/i);
        
        const errorMessage = errorMatch ? errorMatch[1] : 'Server returned HTML instead of JSON';
        
        throw new Error(`HTML Response Error: ${errorMessage}`);
      }

      // Check if response is JSON
      if (this.isJSONResponse(response)) {
        const jsonData = await response.json();
        return jsonData;
      }

      // If neither HTML nor JSON, try to parse as text
      const textData = await response.text();
      
      // Try to parse as JSON
      try {
        return JSON.parse(textData);
      } catch (parseError) {
        throw new Error(`Invalid response format: ${textData.substring(0, 100)}...`);
      }

    } catch (error) {
      console.error('Response handling error:', error);
      throw error;
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Merge with provided options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      console.log(`API Request: ${requestOptions.method || 'GET'} ${url}`);
      
      const response = await fetch(url, requestOptions);
      
      // Log response details
      console.log(`API Response: ${response.status} ${response.statusText}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle different status codes
      if (response.status >= 200 && response.status < 300) {
        return await this.handleResponse(response);
      } else if (response.status === 404) {
        throw new Error(`API endpoint not found: ${url}`);
      } else if (response.status === 500) {
        throw new Error(`Internal server error: ${response.statusText}`);
      } else if (response.status === 502) {
        throw new Error(`Bad gateway: Server is not responding properly`);
      } else if (response.status === 503) {
        throw new Error(`Service unavailable: Server is temporarily down`);
      } else if (response.status === 504) {
        throw new Error(`Gateway timeout: Request took too long`);
      } else {
        // For other error status codes, try to get error message
        try {
          const errorData = await this.handleResponse(response);
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      
      // Handle CORS errors
      if (error.message.includes('CORS')) {
        throw new Error('CORS error: Check server CORS configuration');
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    try {
      return await this.get('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API server is not responding');
    }
  }

  // Test API connectivity
  async testConnection() {
    try {
      const health = await this.healthCheck();
      console.log('API Health Check:', health);
      return true;
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
