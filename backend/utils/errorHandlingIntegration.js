// Error Handling Integration
// Main integration file that ties all error handling components together

import errorManager from './errorManager.js';
import circuitBreakerManager from './circuitBreaker.js';
import { enhancedLogger } from './logger.js';
import { 
  requestContextMiddleware,
  responseLoggingMiddleware,
  asyncErrorWrapper,
  enhancedErrorHandler,
  notFoundHandler,
  rateLimitErrorHandler,
  timeoutErrorHandler,
  requestSizeLimiter,
  responseSizeLimiter,
  databaseErrorHandler,
  externalAPIErrorHandler,
  securityErrorHandler,
  healthCheckMiddleware,
  errorMonitoringMiddleware
} from '../middleware/enhancedErrorHandler.js';

/**
 * Error Handling Integration Class
 */
export class ErrorHandlingIntegration {
  constructor() {
    this.isInitialized = false;
    this.middlewareStack = [];
    this.circuitBreakers = new Map();
    this.retryPolicies = new Map();
  }

  /**
   * Initialize error handling system
   */
  initialize(app) {
    if (this.isInitialized) {
      console.warn('Error handling system already initialized');
      return;
    }

    try {
      // Setup middleware stack
      this.setupMiddlewareStack(app);
      
      // Setup circuit breakers
      this.setupCircuitBreakers();
      
      // Setup retry policies
      this.setupRetryPolicies();
      
      // Setup global error handlers
      this.setupGlobalErrorHandlers();
      
      // Setup monitoring
      this.setupMonitoring();
      
      this.isInitialized = true;
      
      enhancedLogger.info('Error handling system initialized successfully');
    } catch (error) {
      enhancedLogger.error('Failed to initialize error handling system', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup middleware stack
   */
  setupMiddlewareStack(app) {
    // Health check middleware (should be first)
    app.use(healthCheckMiddleware);
    
    // Request context middleware
    app.use(requestContextMiddleware);
    
    // Response logging middleware
    app.use(responseLoggingMiddleware);
    
    // Error monitoring middleware
    app.use(errorMonitoringMiddleware);
    
    // Request size limiter
    app.use(requestSizeLimiter());
    
    // Response size limiter
    app.use(responseSizeLimiter());
    
    // Timeout handler
    app.use(timeoutErrorHandler());
    
    // Rate limiting error handler
    app.use(rateLimitErrorHandler);
    
    // Database error handler
    app.use(databaseErrorHandler);
    
    // External API error handler
    app.use(externalAPIErrorHandler);
    
    // Security error handler
    app.use(securityErrorHandler);
    
    // 404 handler
    app.use(notFoundHandler);
    
    // Enhanced error handler (should be last)
    app.use(enhancedErrorHandler);
    
    enhancedLogger.info('Middleware stack configured');
  }

  /**
   * Setup circuit breakers
   */
  setupCircuitBreakers() {
    // API circuit breaker
    this.circuitBreakers.set('api', circuitBreakerManager.getBreaker('api', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000
    }));

    // Database circuit breaker
    this.circuitBreakers.set('database', circuitBreakerManager.getBreaker('database', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000
    }));

    // External service circuit breaker
    this.circuitBreakers.set('external_service', circuitBreakerManager.getBreaker('external_service', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000
    }));

    enhancedLogger.info('Circuit breakers configured', {
      breakers: Array.from(this.circuitBreakers.keys())
    });
  }

  /**
   * Setup retry policies
   */
  setupRetryPolicies() {
    // API retry policy
    this.retryPolicies.set('api', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    });

    // Database retry policy
    this.retryPolicies.set('database', {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5
    });

    // External service retry policy
    this.retryPolicies.set('external_service', {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 2
    });

    // Set retry policies in error manager
    for (const [operation, policy] of this.retryPolicies) {
      errorManager.setRetryPolicy(operation, policy);
    }

    enhancedLogger.info('Retry policies configured', {
      policies: Array.from(this.retryPolicies.keys())
    });
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      enhancedLogger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      
      // Handle through error manager
      errorManager.handleError(error, { source: 'uncaught_exception' });
      
      // Graceful shutdown
      this.gracefulShutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      enhancedLogger.error('Unhandled Rejection', { 
        reason: reason?.message || reason, 
        promise: promise.toString() 
      });
      
      // Handle through error manager
      errorManager.handleError(reason, { source: 'unhandled_rejection' });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      enhancedLogger.info('SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown(0);
    });

    // Handle SIGINT
    process.on('SIGINT', () => {
      enhancedLogger.info('SIGINT received, starting graceful shutdown');
      this.gracefulShutdown(0);
    });

    enhancedLogger.info('Global error handlers configured');
  }

  /**
   * Setup monitoring
   */
  setupMonitoring() {
    // Health check monitoring
    setInterval(() => {
      const healthStatus = errorManager.getHealthStatus();
      if (healthStatus.status !== 'healthy') {
        enhancedLogger.warn('System health degraded', { healthStatus });
      }
    }, 30000); // Check every 30 seconds

    // Circuit breaker monitoring
    setInterval(() => {
      const circuitBreakerStats = circuitBreakerManager.getStatistics();
      const openBreakers = Object.values(circuitBreakerStats.summary).filter(
        (count, index) => index === 0 && count > 0 // open count
      );
      
      if (openBreakers.length > 0) {
        enhancedLogger.warn('Circuit breakers open', { circuitBreakerStats });
      }
    }, 60000); // Check every minute

    // Error rate monitoring
    setInterval(() => {
      const errorStats = errorManager.getErrorStatistics();
      const totalErrors = errorStats.totalErrors;
      
      if (totalErrors > 100) { // Threshold for high error rate
        enhancedLogger.warn('High error rate detected', { totalErrors });
      }
    }, 300000); // Check every 5 minutes

    enhancedLogger.info('Monitoring configured');
  }

  /**
   * Graceful shutdown
   */
  gracefulShutdown(exitCode) {
    enhancedLogger.info('Starting graceful shutdown', { exitCode });
    
    // Stop error simulation if running
    if (errorManager.errorHistory.length > 0) {
      enhancedLogger.info('Saving error history before shutdown');
    }
    
    // Close database connections
    // This would be implemented based on your database setup
    
    // Close server
    process.exit(exitCode);
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const healthStatus = errorManager.getHealthStatus();
    const errorStats = errorManager.getErrorStatistics();
    const circuitBreakerStats = circuitBreakerManager.getStatistics();
    
    return {
      health: healthStatus,
      errors: errorStats,
      circuitBreakers: circuitBreakerStats,
      initialized: this.isInitialized,
      uptime: process.uptime()
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return errorManager.getErrorStatistics();
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return circuitBreakerManager.getStatistics();
  }

  /**
   * Reset error statistics
   */
  resetErrorStatistics() {
    errorManager.clearHistory();
    enhancedLogger.info('Error statistics reset');
  }

  /**
   * Reset circuit breakers
   */
  resetCircuitBreakers() {
    circuitBreakerManager.resetAll();
    enhancedLogger.info('Circuit breakers reset');
  }

  /**
   * Execute with retry
   */
  async executeWithRetry(operation, fn, context = {}) {
    return await errorManager.executeWithRetry(operation, fn, context);
  }

  /**
   * Execute with circuit breaker
   */
  async executeWithCircuitBreaker(service, fn, context = {}) {
    return await circuitBreakerManager.execute(service, fn, context);
  }

  /**
   * Create error
   */
  createError(errorType, message, context = {}) {
    return errorManager.createAndHandleError(errorType, message, context);
  }

  /**
   * Log error
   */
  logError(error, context = {}) {
    return errorManager.handleError(error, context);
  }
}

// Create singleton instance
export const errorHandlingIntegration = new ErrorHandlingIntegration();

// Export convenience functions
export function initializeErrorHandling(app) {
  return errorHandlingIntegration.initialize(app);
}

export function getSystemStatus() {
  return errorHandlingIntegration.getSystemStatus();
}

export function getErrorStatistics() {
  return errorHandlingIntegration.getErrorStatistics();
}

export function getCircuitBreakerStatus() {
  return errorHandlingIntegration.getCircuitBreakerStatus();
}

export function resetErrorStatistics() {
  return errorHandlingIntegration.resetErrorStatistics();
}

export function resetCircuitBreakers() {
  return errorHandlingIntegration.resetCircuitBreakers();
}

export function executeWithRetry(operation, fn, context = {}) {
  return errorHandlingIntegration.executeWithRetry(operation, fn, context);
}

export function executeWithCircuitBreaker(service, fn, context = {}) {
  return errorHandlingIntegration.executeWithCircuitBreaker(service, fn, context);
}

export function createError(errorType, message, context = {}) {
  return errorHandlingIntegration.createError(errorType, message, context);
}

export function logError(error, context = {}) {
  return errorHandlingIntegration.logError(error, context);
}

export default errorHandlingIntegration;
