// Global Error Handlers for Client-Side
// Comprehensive error handling with window.onerror and unhandledrejection

import { ErrorFactory, ErrorResponseFormatter, ERROR_SEVERITY, ERROR_CATEGORY } from './errorTypes.js';

/**
 * Global Error Handler Class
 */
class GlobalErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 100;
    this.reportingEnabled = true;
    this.retryPolicies = new Map();
    this.offlineDetection = {
      isOnline: navigator.onLine,
      lastOnlineTime: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5
    };
    
    this.initializeHandlers();
    this.setupOfflineDetection();
  }

  /**
   * Initialize global error handlers
   */
  initializeHandlers() {
    // Handle JavaScript errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(message), {
        source,
        lineno,
        colno,
        type: 'javascript_error'
      });
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_promise_rejection',
        promise: event.promise
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event);
      }
    }, true);

    // Handle fetch errors
    this.interceptFetch();
  }

  /**
   * Handle JavaScript errors
   */
  handleError(error, context = {}) {
    try {
      // Convert to our error type
      const baseError = ErrorFactory.fromUnknownError(error, {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });

      // Add to history
      this.addToHistory(baseError);

      // Update error counts
      this.updateErrorCounts(baseError);

      // Log error
      console.error('Global error handler caught:', baseError);

      // Report error
      if (this.reportingEnabled) {
        this.reportError(baseError);
      }

      // Check for error thresholds
      this.checkErrorThresholds(baseError);

      return baseError;
    } catch (handlingError) {
      console.error('Error in global error handler:', handlingError);
      return error;
    }
  }

  /**
   * Handle resource loading errors
   */
  handleResourceError(event) {
    const { target } = event;
    let errorMessage = 'Resource loading failed';
    let category = ERROR_CATEGORY.SYSTEM;

    if (target.tagName === 'IMG') {
      errorMessage = 'Image loading failed';
      category = ERROR_CATEGORY.RENDERING;
    } else if (target.tagName === 'SCRIPT') {
      errorMessage = 'Script loading failed';
      category = ERROR_CATEGORY.SYSTEM;
    } else if (target.tagName === 'LINK') {
      errorMessage = 'Stylesheet loading failed';
      category = ERROR_CATEGORY.RENDERING;
    }

    const error = ErrorFactory.createRenderingError(
      errorMessage,
      target.tagName,
      {
        src: target.src || target.href,
        type: 'resource_error'
      }
    );

    this.handleError(error);
  }

  /**
   * Intercept fetch requests for error handling
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for HTTP error status
        if (!response.ok) {
          const error = ErrorFactory.createAPIError(
            `HTTP ${response.status}: ${response.statusText}`,
            args[0],
            response.status,
            { method: args[1]?.method || 'GET' }
          );
          this.handleError(error);
        }
        
        return response;
      } catch (error) {
        // Network errors
        const networkError = ErrorFactory.createNetworkError(
          'Network request failed',
          args[0],
          null,
          { method: args[1]?.method || 'GET', originalError: error.message }
        );
        this.handleError(networkError);
        throw error;
      }
    };
  }

  /**
   * Setup offline detection
   */
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.offlineDetection.isOnline = true;
      this.offlineDetection.lastOnlineTime = new Date().toISOString();
      this.offlineDetection.reconnectAttempts = 0;
      
      console.log('Connection restored');
      this.handleConnectionRestored();
    });

    window.addEventListener('offline', () => {
      this.offlineDetection.isOnline = false;
      
      const error = ErrorFactory.createNetworkError(
        'Connection lost',
        null,
        null,
        { type: 'offline_detection' }
      );
      
      this.handleError(error);
    });
  }

  /**
   * Handle connection restored
   */
  handleConnectionRestored() {
    // Retry failed requests
    this.retryFailedRequests();
    
    // Show connection restored notification
    this.showNotification('Connection restored', 'success');
  }

  /**
   * Retry failed requests
   */
  async retryFailedRequests() {
    // This would integrate with your API client to retry failed requests
    console.log('Retrying failed requests...');
  }

  /**
   * Add error to history
   */
  addToHistory(error) {
    this.errorHistory.unshift({
      ...error.toJSON(),
      handledAt: new Date().toISOString()
    });

    // Maintain max history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Update error counts
   */
  updateErrorCounts(error) {
    const key = `${error.category}_${error.severity}`;
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }

  /**
   * Check error thresholds
   */
  checkErrorThresholds(error) {
    const key = `${error.category}_${error.severity}`;
    const count = this.errorCounts.get(key) || 0;
    
    // Show warning for high error rates
    if (count > 10 && error.severity === ERROR_SEVERITY.ERROR) {
      this.showNotification('High error rate detected', 'warning');
    }
    
    if (count > 5 && error.severity === ERROR_SEVERITY.CRITICAL) {
      this.showNotification('Critical errors detected', 'error');
    }
  }

  /**
   * Report error to monitoring service
   */
  async reportError(error) {
    try {
      const errorData = {
        ...error.toJSON(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        online: this.offlineDetection.isOnline
      };

      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      type === 'success' ? 'bg-green-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return {
      counts: Object.fromEntries(this.errorCounts),
      history: this.errorHistory.slice(0, 50),
      totalErrors: this.errorHistory.length,
      online: this.offlineDetection.isOnline
    };
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
  }

  /**
   * Enable/disable error reporting
   */
  setReportingEnabled(enabled) {
    this.reportingEnabled = enabled;
  }

  /**
   * Set retry policy for specific operations
   */
  setRetryPolicy(operation, policy) {
    this.retryPolicies.set(operation, policy);
  }

  /**
   * Get retry policy
   */
  getRetryPolicy(operation) {
    return this.retryPolicies.get(operation) || {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    };
  }

  /**
   * Execute with retry
   */
  async executeWithRetry(operation, fn, context = {}) {
    const policy = this.getRetryPolicy(operation);
    let lastError;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === policy.maxRetries) {
          break;
        }

        const delay = Math.min(
          policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt),
          policy.maxDelay
        );

        console.warn(`Retry attempt ${attempt + 1} for operation ${operation}`, {
          error: error.message,
          delay
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Export convenience functions
export function handleError(error, context = {}) {
  return globalErrorHandler.handleError(error, context);
}

export function getErrorStatistics() {
  return globalErrorHandler.getErrorStatistics();
}

export function clearErrorHistory() {
  globalErrorHandler.clearHistory();
}

export function setErrorReportingEnabled(enabled) {
  globalErrorHandler.setReportingEnabled(enabled);
}

export function executeWithRetry(operation, fn, context = {}) {
  return globalErrorHandler.executeWithRetry(operation, fn, context);
}

export default globalErrorHandler;
