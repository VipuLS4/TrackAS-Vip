// Enhanced Error Handling Middleware
// Comprehensive error handling with request/response logging, circuit breakers, and monitoring

import errorManager from '../utils/errorManager.js';
import { ErrorFactory, ERROR_SEVERITY, ERROR_CATEGORY } from '../utils/errorTypes.js';
import logger from '../utils/logger.js';

/**
 * Request context middleware
 * Captures request information for error correlation
 */
export function requestContextMiddleware(req, res, next) {
  // Generate request ID
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Capture request context
  req.errorContext = {
    requestId: req.requestId,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    sessionId: req.sessionID,
    timestamp: new Date().toISOString(),
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? 'Bearer ***' : undefined,
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  };

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next();
}

/**
 * Response logging middleware
 * Logs response details for error correlation
 */
export function responseLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      responseSize: JSON.stringify(data).length
    });

    return originalJson.call(this, data);
  };

  // Override res.send to capture response data
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      responseSize: data ? data.length : 0
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncErrorWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Enhanced error handler middleware
 * Comprehensive error handling with logging and monitoring
 */
export function enhancedErrorHandler(err, req, res, next) {
  // Add request context to error
  const errorContext = {
    ...req.errorContext,
    body: req.body,
    query: req.query,
    params: req.params
  };

  // Handle error through error manager
  errorManager.handleError(err, errorContext).then(handledError => {
    // Determine if we should include stack trace
    const includeStack = process.env.NODE_ENV === 'development' || 
                       process.env.INCLUDE_ERROR_STACK === 'true';

    // Determine if we should include context
    const includeContext = process.env.NODE_ENV === 'development' ||
                          process.env.INCLUDE_ERROR_CONTEXT === 'true';

    // Format error response
    const errorResponse = errorManager.formatErrorForResponse(
      handledError, 
      includeStack, 
      includeContext
    );

    // Set appropriate status code
    const statusCode = getStatusCode(handledError);
    res.status(statusCode);

    // Add retry-after header if applicable
    if (handledError.retryAfter) {
      res.set('Retry-After', handledError.retryAfter);
    }

    // Add correlation ID header
    res.set('X-Correlation-ID', handledError.correlationId);

    // Send error response
    res.json(errorResponse);
  }).catch(handlingError => {
    // Fallback error handling
    logger.error('Error in error handler:', handlingError);
    
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        correlationId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  });
}

/**
 * Get appropriate HTTP status code for error
 */
function getStatusCode(error) {
  // Custom error codes
  if (error.code) {
    const statusMap = {
      'VALIDATION_ERROR': 400,
      'AUTHENTICATION_ERROR': 401,
      'AUTHORIZATION_ERROR': 403,
      'NOT_FOUND': 404,
      'RATE_LIMIT_ERROR': 429,
      'TIMEOUT_ERROR': 504,
      'CIRCUIT_BREAKER_ERROR': 503,
      'EXTERNAL_API_ERROR': 502,
      'DATABASE_ERROR': 500,
      'NETWORK_ERROR': 502,
      'SECURITY_ERROR': 403,
      'PERFORMANCE_ERROR': 500,
      'BUSINESS_LOGIC_ERROR': 400,
      'SYSTEM_ERROR': 500
    };
    
    return statusMap[error.code] || 500;
  }

  // Default status codes based on error type
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'UnauthorizedError') return 401;
  if (error.name === 'ForbiddenError') return 403;
  if (error.name === 'NotFoundError') return 404;
  if (error.name === 'ConflictError') return 409;
  if (error.name === 'TooManyRequestsError') return 429;
  if (error.name === 'TimeoutError') return 504;

  return 500;
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res, next) {
  const error = ErrorFactory.createBusinessLogicError(
    `Route not found: ${req.method} ${req.url}`,
    'ROUTE_NOT_FOUND',
    { url: req.url, method: req.method }
  );
  
  next(error);
}

/**
 * Rate limiting error handler
 */
export function rateLimitErrorHandler(req, res, next) {
  const error = ErrorFactory.createRateLimitError(
    'Too many requests, please try again later',
    req.rateLimit?.limit,
    req.rateLimit?.remaining,
    req.rateLimit?.resetTime,
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );
  
  next(error);
}

/**
 * Timeout error handler
 */
export function timeoutErrorHandler(timeout = 30000) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const error = ErrorFactory.createTimeoutError(
          'Request timeout',
          timeout,
          `${req.method} ${req.url}`,
          { requestId: req.requestId }
        );
        next(error);
      }
    }, timeout);
    
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}

/**
 * Request size limiter with error handling
 */
export function requestSizeLimiter(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024;
    
    if (contentLength > maxSizeBytes) {
      const error = ErrorFactory.createValidationError(
        `Request body exceeds ${maxSize} limit`,
        'content-length',
        contentLength,
        { maxSize, actualSize: contentLength }
      );
      return next(error);
    }
    
    next();
  };
}

/**
 * Response size limiter with error handling
 */
export function responseSizeLimiter(maxSize = '6mb') {
  return (req, res, next) => {
    const originalSend = res.send;
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024;
    
    res.send = function(data) {
      if (data && data.length > maxSizeBytes) {
        const error = ErrorFactory.createPerformanceError(
          `Response exceeds ${maxSize} limit`,
          'response-size',
          maxSizeBytes,
          { maxSize, actualSize: data.length }
        );
        return next(error);
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Database error handler
 */
export function databaseErrorHandler(err, req, res, next) {
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint errors
    const error = ErrorFactory.createValidationError(
      'Database constraint violation',
      null,
      null,
      { originalError: err.message, code: err.code }
    );
    return next(error);
  }
  
  if (err.code === 'ECONNREFUSED') {
    const error = ErrorFactory.createDatabaseError(
      'Database connection failed',
      null,
      null,
      { originalError: err.message }
    );
    return next(error);
  }
  
  next(err);
}

/**
 * External API error handler
 */
export function externalAPIErrorHandler(err, req, res, next) {
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    const error = ErrorFactory.createExternalAPIError(
      'External service unavailable',
      err.hostname,
      err.port,
      err.statusCode,
      { originalError: err.message }
    );
    return next(error);
  }
  
  if (err.status >= 400 && err.status < 500) {
    const error = ErrorFactory.createExternalAPIError(
      'External API client error',
      err.config?.url,
      err.config?.method,
      err.status,
      { originalError: err.message }
    );
    return next(error);
  }
  
  if (err.status >= 500) {
    const error = ErrorFactory.createExternalAPIError(
      'External API server error',
      err.config?.url,
      err.config?.method,
      err.status,
      { originalError: err.message }
    );
    return next(error);
  }
  
  next(err);
}

/**
 * Security error handler
 */
export function securityErrorHandler(err, req, res, next) {
  if (err.name === 'JsonWebTokenError') {
    const error = ErrorFactory.createSecurityError(
      'Invalid token',
      'INVALID_TOKEN',
      { ip: req.ip, userAgent: req.get('User-Agent') }
    );
    return next(error);
  }
  
  if (err.name === 'TokenExpiredError') {
    const error = ErrorFactory.createSecurityError(
      'Token expired',
      'EXPIRED_TOKEN',
      { ip: req.ip, userAgent: req.get('User-Agent') }
    );
    return next(error);
  }
  
  next(err);
}

/**
 * Health check middleware
 */
export function healthCheckMiddleware(req, res, next) {
  if (req.path === '/health' || req.path === '/healthz') {
    const healthStatus = errorManager.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: healthStatus.uptime,
      errors: {
        critical: healthStatus.criticalErrors,
        total: healthStatus.totalErrors
      },
      circuitBreakers: {
        open: healthStatus.openCircuitBreakers
      }
    });
    return;
  }
  
  next();
}

/**
 * Error monitoring middleware
 */
export function errorMonitoringMiddleware(req, res, next) {
  // Monitor for potential errors
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode
      });
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      logger.warn('Error response', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration
      });
    }
  });
  
  next();
}

export default {
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
};
