// Comprehensive Vercel Error Handler
// Handles all Vercel error codes with specific strategies and optimizations

import { 
  VercelErrorFactory, 
  VercelErrorResponseFormatter,
  VERCEL_ERROR_CODES,
  VERCEL_ERROR_CATEGORY 
} from './vercelErrorTypes.js';
import { enhancedLogger } from './logger.js';
import circuitBreakerManager from './circuitBreaker.js';

/**
 * Vercel Error Handler Class
 */
export class VercelErrorHandler {
  constructor() {
    this.retryStrategies = new Map();
    this.circuitBreakers = new Map();
    this.deploymentStatus = new Map();
    this.dnsCache = new Map();
    this.performanceMetrics = new Map();
    
    this.initializeRetryStrategies();
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize retry strategies for different error types
   */
  initializeRetryStrategies() {
    // Function errors - 3 retries with exponential backoff
    this.retryStrategies.set(VERCEL_ERROR_CODES.FUNCTION_INVOCATION_FAILED, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 4000,
      backoffMultiplier: 2,
      jitter: true
    });

    this.retryStrategies.set(VERCEL_ERROR_CODES.FUNCTION_INVOCATION_TIMEOUT, {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 8000,
      backoffMultiplier: 2,
      jitter: true
    });

    // Edge function errors - similar to function errors
    this.retryStrategies.set(VERCEL_ERROR_CODES.EDGE_FUNCTION_INVOCATION_FAILED, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 4000,
      backoffMultiplier: 2,
      jitter: true
    });

    // Throttling errors - longer delays
    this.retryStrategies.set(VERCEL_ERROR_CODES.FUNCTION_THROTTLED, {
      maxRetries: 5,
      baseDelay: 5000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
      jitter: true
    });

    // DNS errors - immediate retry with different resolver
    this.retryStrategies.set(VERCEL_ERROR_CODES.DNS_HOSTNAME_RESOLVE_FAILED, {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2,
      jitter: false
    });

    // Request errors - no retry for client errors
    this.retryStrategies.set(VERCEL_ERROR_CODES.INVALID_REQUEST_METHOD, {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      jitter: false
    });

    // Platform errors - immediate alert, no retry
    this.retryStrategies.set(VERCEL_ERROR_CODES.TOO_MANY_FILESYSTEM_CHECKS, {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      jitter: false
    });
  }

  /**
   * Initialize circuit breakers for external services
   */
  initializeCircuitBreakers() {
    // External API circuit breaker
    this.circuitBreakers.set('external_api', circuitBreakerManager.getBreaker('external_api', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000
    }));

    // DNS resolution circuit breaker
    this.circuitBreakers.set('dns', circuitBreakerManager.getBreaker('dns', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000
    }));

    // Image optimization circuit breaker
    this.circuitBreakers.set('image_optimization', circuitBreakerManager.getBreaker('image_optimization', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 45000
    }));
  }

  /**
   * Handle Vercel error with appropriate strategy
   */
  async handleVercelError(error, context = {}) {
    try {
      const vercelError = VercelErrorFactory.fromVercelCode(error.code || error.name, {
        ...context,
        originalError: error.message,
        stack: error.stack
      });

      // Log the error
      await this.logVercelError(vercelError, context);

      // Apply appropriate strategy based on error type
      const strategy = this.getErrorStrategy(vercelError);
      const result = await this.applyStrategy(strategy, vercelError, context);

      return result;
    } catch (handlingError) {
      enhancedLogger.error('Error in Vercel error handler:', {
        originalError: error,
        handlingError: handlingError,
        context
      });
      
      // Fallback to basic error response
      return this.createFallbackResponse(error);
    }
  }

  /**
   * Get error handling strategy
   */
  getErrorStrategy(error) {
    const strategies = {
      [VERCEL_ERROR_CATEGORY.FUNCTION]: 'retry_with_backoff',
      [VERCEL_ERROR_CATEGORY.EDGE_FUNCTION]: 'retry_with_backoff',
      [VERCEL_ERROR_CATEGORY.DEPLOYMENT]: 'check_deployment_status',
      [VERCEL_ERROR_CATEGORY.DNS]: 'dns_fallback',
      [VERCEL_ERROR_CATEGORY.REQUEST]: 'client_error_response',
      [VERCEL_ERROR_CATEGORY.IMAGE]: 'image_fallback',
      [VERCEL_ERROR_CATEGORY.ROUTING]: 'route_fallback',
      [VERCEL_ERROR_CATEGORY.CACHE]: 'cache_fallback',
      [VERCEL_ERROR_CATEGORY.MIDDLEWARE]: 'middleware_fallback',
      [VERCEL_ERROR_CATEGORY.SANDBOX]: 'sandbox_restart',
      [VERCEL_ERROR_CATEGORY.PLATFORM]: 'platform_alert',
      [VERCEL_ERROR_CATEGORY.INTERNAL]: 'immediate_alert'
    };

    return strategies[error.category] || 'default_response';
  }

  /**
   * Apply error handling strategy
   */
  async applyStrategy(strategy, error, context) {
    switch (strategy) {
      case 'retry_with_backoff':
        return await this.handleRetryWithBackoff(error, context);
      
      case 'check_deployment_status':
        return await this.handleDeploymentError(error, context);
      
      case 'dns_fallback':
        return await this.handleDNSError(error, context);
      
      case 'client_error_response':
        return this.handleClientError(error, context);
      
      case 'image_fallback':
        return await this.handleImageError(error, context);
      
      case 'route_fallback':
        return await this.handleRoutingError(error, context);
      
      case 'cache_fallback':
        return await this.handleCacheError(error, context);
      
      case 'middleware_fallback':
        return await this.handleMiddlewareError(error, context);
      
      case 'sandbox_restart':
        return await this.handleSandboxError(error, context);
      
      case 'platform_alert':
        return await this.handlePlatformError(error, context);
      
      case 'immediate_alert':
        return await this.handleImmediateAlert(error, context);
      
      default:
        return this.createDefaultResponse(error, context);
    }
  }

  /**
   * Handle retry with exponential backoff
   */
  async handleRetryWithBackoff(error, context) {
    const retryConfig = this.retryStrategies.get(error.code);
    if (!retryConfig || retryConfig.maxRetries === 0) {
      return this.createErrorResponse(error, 500);
    }

    let lastError = error;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Simulate retry attempt
        const result = await this.attemptRetry(error, context, attempt);
        if (result.success) {
          enhancedLogger.info('Vercel error retry successful', {
            errorCode: error.code,
            attempts: attempt + 1,
            correlationId: error.correlationId
          });
          return result.response;
        }
      } catch (retryError) {
        lastError = retryError;
        
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with jitter
        const delay = this.calculateRetryDelay(retryConfig, attempt);
        await this.sleep(delay);
      }
    }

    // All retries failed
    enhancedLogger.warn('Vercel error retry failed', {
      errorCode: error.code,
      attempts: retryConfig.maxRetries + 1,
      correlationId: error.correlationId
    });

    return this.createErrorResponse(lastError, 500);
  }

  /**
   * Handle deployment errors
   */
  async handleDeploymentError(error, context) {
    const deploymentId = context.deploymentId || 'unknown';
    
    // Check deployment status
    const status = await this.checkDeploymentStatus(deploymentId);
    
    if (status === 'ready') {
      // Deployment is ready, retry the request
      return await this.handleRetryWithBackoff(error, context);
    } else if (status === 'building') {
      // Deployment is building, return appropriate response
      return this.createErrorResponse(error, 503, {
        message: 'Service is being deployed. Please try again in a few minutes.',
        retryAfter: 300 // 5 minutes
      });
    } else {
      // Deployment failed or is in error state
      return this.createErrorResponse(error, 503, {
        message: 'Service is temporarily unavailable. Please contact support.',
        retryAfter: 600 // 10 minutes
      });
    }
  }

  /**
   * Handle DNS errors
   */
  async handleDNSError(error, context) {
    const hostname = context.hostname || 'unknown';
    
    // Check DNS cache
    const cachedResult = this.dnsCache.get(hostname);
    if (cachedResult && Date.now() - cachedResult.timestamp < 300000) { // 5 minutes
      return this.createSuccessResponse(cachedResult.data);
    }

    // Try alternative DNS resolvers
    const dnsResult = await this.resolveWithFallback(hostname);
    if (dnsResult.success) {
      // Cache successful result
      this.dnsCache.set(hostname, {
        data: dnsResult.data,
        timestamp: Date.now()
      });
      return this.createSuccessResponse(dnsResult.data);
    }

    // DNS resolution failed
    return this.createErrorResponse(error, 502, {
      message: 'Unable to resolve hostname. Please check the URL.',
      retryAfter: 60
    });
  }

  /**
   * Handle client errors (4xx)
   */
  handleClientError(error, context) {
    const statusCode = this.getClientErrorStatusCode(error.code);
    return this.createErrorResponse(error, statusCode, {
      message: VercelErrorResponseFormatter.getUserFriendlyMessage(error)
    });
  }

  /**
   * Handle image optimization errors
   */
  async handleImageError(error, context) {
    const imageUrl = context.imageUrl;
    
    if (!imageUrl) {
      return this.createErrorResponse(error, 400, {
        message: 'Image URL is required for optimization.'
      });
    }

    // Try alternative image optimization service
    const fallbackResult = await this.optimizeImageWithFallback(imageUrl);
    if (fallbackResult.success) {
      return this.createSuccessResponse(fallbackResult.data);
    }

    // Return original image URL as fallback
    return this.createSuccessResponse({
      url: imageUrl,
      optimized: false,
      fallback: true
    });
  }

  /**
   * Handle routing errors
   */
  async handleRoutingError(error, context) {
    const route = context.route || 'unknown';
    
    // Check if route exists in fallback routes
    const fallbackRoute = this.getFallbackRoute(route);
    if (fallbackRoute) {
      return this.createRedirectResponse(fallbackRoute);
    }

    // Return 404 with helpful message
    return this.createErrorResponse(error, 404, {
      message: 'The requested route was not found. Please check the URL.',
      suggestions: this.getRouteSuggestions(route)
    });
  }

  /**
   * Handle cache errors
   */
  async handleCacheError(error, context) {
    const cacheKey = context.cacheKey;
    
    // Clear problematic cache entry
    if (cacheKey) {
      await this.clearCacheEntry(cacheKey);
    }

    // Try to regenerate data
    const freshData = await this.regenerateData(context);
    if (freshData.success) {
      return this.createSuccessResponse(freshData.data);
    }

    // Return error response
    return this.createErrorResponse(error, 500, {
      message: 'Cache error occurred. Please try again.',
      retryAfter: 30
    });
  }

  /**
   * Handle middleware errors
   */
  async handleMiddlewareError(error, context) {
    const middlewareName = context.middlewareName || 'unknown';
    
    // Log middleware error
    enhancedLogger.error('Middleware error occurred', {
      middleware: middlewareName,
      error: error.message,
      correlationId: error.correlationId
    });

    // Try to bypass problematic middleware
    const bypassResult = await this.bypassMiddleware(middlewareName, context);
    if (bypassResult.success) {
      return this.createSuccessResponse(bypassResult.data);
    }

    // Return error response
    return this.createErrorResponse(error, 500, {
      message: 'Middleware error occurred. Please try again.',
      retryAfter: 60
    });
  }

  /**
   * Handle sandbox errors
   */
  async handleSandboxError(error, context) {
    const sandboxId = context.sandboxId || 'unknown';
    
    // Try to restart sandbox
    const restartResult = await this.restartSandbox(sandboxId);
    if (restartResult.success) {
      return this.createSuccessResponse({
        message: 'Development environment restarted successfully.',
        sandboxId: sandboxId
      });
    }

    // Return error response
    return this.createErrorResponse(error, 503, {
      message: 'Development environment is unavailable. Please contact support.',
      retryAfter: 300
    });
  }

  /**
   * Handle platform errors
   */
  async handlePlatformError(error, context) {
    // Log critical platform error
    enhancedLogger.error('Critical platform error', {
      error: error.message,
      code: error.code,
      correlationId: error.correlationId,
      context
    });

    // Send immediate alert
    await this.sendCriticalAlert(error, context);

    // Return error response
    return this.createErrorResponse(error, 500, {
      message: 'A critical system error occurred. Our team has been notified.',
      retryAfter: 300
    });
  }

  /**
   * Handle immediate alert errors
   */
  async handleImmediateAlert(error, context) {
    // Send immediate alert
    await this.sendCriticalAlert(error, context);

    // Return error response
    return this.createErrorResponse(error, 500, {
      message: 'A system error occurred. Our team has been notified.',
      retryAfter: 0
    });
  }

  /**
   * Create error response
   */
  createErrorResponse(error, statusCode, additionalData = {}) {
    const response = VercelErrorResponseFormatter.formatForClient(error);
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': error.correlationId,
        'X-Error-Code': error.code,
        'X-Error-Category': error.category
      },
      body: JSON.stringify({
        ...response,
        ...additionalData
      })
    };
  }

  /**
   * Create success response
   */
  createSuccessResponse(data) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  }

  /**
   * Create redirect response
   */
  createRedirectResponse(url) {
    return {
      statusCode: 302,
      headers: {
        'Location': url
      },
      body: ''
    };
  }

  /**
   * Create fallback response
   */
  createFallbackResponse(error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR',
          correlationId: `fallback_${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      })
    };
  }

  /**
   * Create default response
   */
  createDefaultResponse(error, context) {
    return this.createErrorResponse(error, 500, {
      message: 'An error occurred. Please try again.',
      retryAfter: 60
    });
  }

  /**
   * Log Vercel error
   */
  async logVercelError(error, context) {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        category: error.category,
        severity: error.severity,
        platform: error.platform
      },
      context,
      correlationId: error.correlationId,
      timestamp: error.timestamp
    };

    switch (error.severity) {
      case 'CRITICAL':
        enhancedLogger.error('CRITICAL Vercel Error', logData);
        break;
      case 'ERROR':
        enhancedLogger.error('Vercel Error', logData);
        break;
      case 'WARNING':
        enhancedLogger.warn('Vercel Warning', logData);
        break;
      default:
        enhancedLogger.info('Vercel Info', logData);
    }
  }

  /**
   * Calculate retry delay with jitter
   */
  calculateRetryDelay(config, attempt) {
    const baseDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const delay = Math.min(baseDelay, config.maxDelay);
    
    if (config.jitter) {
      const jitter = Math.random() * 0.1 * delay; // 10% jitter
      return delay + jitter;
    }
    
    return delay;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get client error status code
   */
  getClientErrorStatusCode(errorCode) {
    const statusMap = {
      [VERCEL_ERROR_CODES.INVALID_REQUEST_METHOD]: 405,
      [VERCEL_ERROR_CODES.MALFORMED_REQUEST_HEADER]: 400,
      [VERCEL_ERROR_CODES.REQUEST_HEADER_TOO_LARGE]: 431,
      [VERCEL_ERROR_CODES.URL_TOO_LONG]: 414,
      [VERCEL_ERROR_CODES.RANGE_END_NOT_VALID]: 416,
      [VERCEL_ERROR_CODES.RANGE_GROUP_NOT_VALID]: 416,
      [VERCEL_ERROR_CODES.RANGE_MISSING_UNIT]: 416,
      [VERCEL_ERROR_CODES.RANGE_START_NOT_VALID]: 416,
      [VERCEL_ERROR_CODES.RANGE_UNIT_NOT_SUPPORTED]: 416,
      [VERCEL_ERROR_CODES.TOO_MANY_RANGES]: 416,
      [VERCEL_ERROR_CODES.INVALID_IMAGE_OPTIMIZE_REQUEST]: 400
    };

    return statusMap[errorCode] || 400;
  }

  // Placeholder methods for external integrations
  async checkDeploymentStatus(deploymentId) {
    // Implement deployment status check
    return 'ready';
  }

  async resolveWithFallback(hostname) {
    // Implement DNS resolution with fallback
    return { success: false };
  }

  async optimizeImageWithFallback(imageUrl) {
    // Implement image optimization with fallback
    return { success: false };
  }

  getFallbackRoute(route) {
    // Implement fallback route logic
    return null;
  }

  getRouteSuggestions(route) {
    // Implement route suggestions
    return [];
  }

  async clearCacheEntry(cacheKey) {
    // Implement cache clearing
  }

  async regenerateData(context) {
    // Implement data regeneration
    return { success: false };
  }

  async bypassMiddleware(middlewareName, context) {
    // Implement middleware bypass
    return { success: false };
  }

  async restartSandbox(sandboxId) {
    // Implement sandbox restart
    return { success: false };
  }

  async sendCriticalAlert(error, context) {
    // Implement critical alert sending
    enhancedLogger.error('CRITICAL ALERT SENT', {
      error: error.message,
      code: error.code,
      correlationId: error.correlationId
    });
  }

  async attemptRetry(error, context, attempt) {
    // Implement retry attempt logic
    return { success: false };
  }
}

// Export singleton instance
export const vercelErrorHandler = new VercelErrorHandler();

export default vercelErrorHandler;

