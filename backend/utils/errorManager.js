// Centralized Error Manager with Singleton Pattern
// Comprehensive error handling, logging, and monitoring system

import logger from './logger.js';
import { ErrorFactory, ErrorResponseFormatter, ERROR_SEVERITY, ERROR_CATEGORY } from './errorTypes.js';

/**
 * Centralized Error Manager
 * Singleton pattern for consistent error handling across the application
 */
class ErrorManager {
  constructor() {
    if (ErrorManager.instance) {
      return ErrorManager.instance;
    }

    this.errorCounts = new Map();
    this.errorHistory = [];
    this.maxHistorySize = 1000;
    this.alertThresholds = {
      [ERROR_SEVERITY.CRITICAL]: 1,
      [ERROR_SEVERITY.ERROR]: 10,
      [ERROR_SEVERITY.WARNING]: 50
    };
    this.circuitBreakers = new Map();
    this.retryPolicies = new Map();
    this.monitoringEnabled = true;
    this.alertingEnabled = true;

    ErrorManager.instance = this;
  }

  /**
   * Log and handle error
   */
  async handleError(error, context = {}) {
    try {
      // Convert unknown errors to BaseError
      const baseError = ErrorFactory.fromUnknownError(error, context);
      
      // Add correlation ID if not present
      if (!baseError.correlationId) {
        baseError.correlationId = this.generateCorrelationId();
      }

      // Update error counts
      this.updateErrorCounts(baseError);

      // Add to history
      this.addToHistory(baseError);

      // Log error
      await this.logError(baseError);

      // Check for alerts
      if (this.alertingEnabled) {
        await this.checkAlerts(baseError);
      }

      // Check circuit breakers
      await this.checkCircuitBreakers(baseError);

      return baseError;
    } catch (handlingError) {
      // Fallback error handling
      logger.error('Error in error handling:', {
        originalError: error,
        handlingError: handlingError,
        context
      });
      return error;
    }
  }

  /**
   * Create and handle error
   */
  async createAndHandleError(errorType, message, context = {}) {
    const error = ErrorFactory[`create${errorType}Error`](message, context);
    return await this.handleError(error, context);
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Log error with structured format
   */
  async logError(error) {
    const logData = {
      correlationId: error.correlationId,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        severity: error.severity,
        category: error.category,
        context: error.context,
        stack: error.stack
      },
      timestamp: error.timestamp,
      metadata: {
        userAgent: error.context?.userAgent,
        ip: error.context?.ip,
        userId: error.context?.userId,
        sessionId: error.context?.sessionId,
        requestId: error.context?.requestId,
        url: error.context?.url,
        method: error.context?.method
      }
    };

    // Log based on severity
    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
        logger.error('CRITICAL ERROR', logData);
        break;
      case ERROR_SEVERITY.ERROR:
        logger.error('ERROR', logData);
        break;
      case ERROR_SEVERITY.WARNING:
        logger.warn('WARNING', logData);
        break;
      case ERROR_SEVERITY.INFO:
        logger.info('INFO', logData);
        break;
      case ERROR_SEVERITY.DEBUG:
        logger.debug('DEBUG', logData);
        break;
      default:
        logger.error('UNKNOWN SEVERITY', logData);
    }
  }

  /**
   * Check for alerts
   */
  async checkAlerts(error) {
    const key = `${error.category}_${error.severity}`;
    const count = this.errorCounts.get(key) || 0;
    const threshold = this.alertThresholds[error.severity];

    if (threshold && count >= threshold) {
      await this.sendAlert(error, count, threshold);
    }
  }

  /**
   * Send alert
   */
  async sendAlert(error, count, threshold) {
    const alert = {
      type: 'ERROR_THRESHOLD_EXCEEDED',
      severity: error.severity,
      category: error.category,
      count,
      threshold,
      correlationId: error.correlationId,
      timestamp: new Date().toISOString(),
      message: `Error threshold exceeded: ${count} ${error.severity} errors in ${error.category} category`
    };

    logger.error('ALERT', alert);

    // Here you would integrate with your alerting system
    // e.g., Slack, PagerDuty, email, etc.
    await this.sendToAlertingService(alert);
  }

  /**
   * Send to alerting service
   */
  async sendToAlertingService(alert) {
    // Implement your alerting service integration here
    // Examples: Slack webhook, PagerDuty API, email service, etc.
    console.log('Alert sent:', alert);
  }

  /**
   * Check circuit breakers
   */
  async checkCircuitBreakers(error) {
    if (error.category === ERROR_CATEGORY.EXTERNAL_API) {
      const service = error.context?.service;
      if (service) {
        await this.updateCircuitBreaker(service, error);
      }
    }
  }

  /**
   * Update circuit breaker
   */
  async updateCircuitBreaker(service, error) {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(service, {
        failures: 0,
        lastFailure: null,
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        nextAttempt: null
      });
    }

    const breaker = this.circuitBreakers.get(service);
    breaker.failures++;
    breaker.lastFailure = new Date().toISOString();

    // Open circuit if failure threshold exceeded
    if (breaker.failures >= 5) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = new Date(Date.now() + 60000); // 1 minute
      logger.warn(`Circuit breaker opened for service: ${service}`);
    }
  }

  /**
   * Check if circuit breaker allows request
   */
  canMakeRequest(service) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return true;

    if (breaker.state === 'CLOSED') return true;
    if (breaker.state === 'OPEN') {
      if (new Date() > breaker.nextAttempt) {
        breaker.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    if (breaker.state === 'HALF_OPEN') return true;

    return false;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(service) {
    const breaker = this.circuitBreakers.get(service);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'CLOSED';
      breaker.nextAttempt = null;
      logger.info(`Circuit breaker reset for service: ${service}`);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return {
      counts: Object.fromEntries(this.errorCounts),
      history: this.errorHistory.slice(0, 100), // Last 100 errors
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      totalErrors: this.errorHistory.length
    };
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category, limit = 50) {
    return this.errorHistory
      .filter(error => error.category === category)
      .slice(0, limit);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity, limit = 50) {
    return this.errorHistory
      .filter(error => error.severity === severity)
      .slice(0, limit);
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
    logger.info('Error history cleared');
  }

  /**
   * Set retry policy
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

        logger.warn(`Retry attempt ${attempt + 1} for operation ${operation}`, {
          error: error.message,
          delay,
          correlationId: context.correlationId
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

  /**
   * Format error for response
   */
  formatErrorForResponse(error, includeStack = false, includeContext = true) {
    return ErrorResponseFormatter.format(error, includeStack, includeContext);
  }

  /**
   * Format error for client
   */
  formatErrorForClient(error, userFriendlyMessage = null) {
    return ErrorResponseFormatter.formatForClient(error, userFriendlyMessage);
  }

  /**
   * Health check
   */
  getHealthStatus() {
    const criticalErrors = this.errorCounts.get(`${ERROR_CATEGORY.SYSTEM}_${ERROR_SEVERITY.CRITICAL}`) || 0;
    const openCircuitBreakers = Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'OPEN').length;

    return {
      status: criticalErrors > 0 || openCircuitBreakers > 0 ? 'unhealthy' : 'healthy',
      criticalErrors,
      openCircuitBreakers,
      totalErrors: this.errorHistory.length,
      uptime: process.uptime()
    };
  }
}

// Export singleton instance
export default new ErrorManager();
