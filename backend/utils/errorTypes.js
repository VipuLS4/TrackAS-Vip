// Custom Error Types and Error Factory
// Comprehensive error handling system with TypeScript-like definitions

/**
 * Error Severity Levels
 */
export const ERROR_SEVERITY = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR', 
  WARNING: 'WARNING',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Error Categories
 */
export const ERROR_CATEGORY = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NETWORK: 'NETWORK',
  DATABASE: 'DATABASE',
  EXTERNAL_API: 'EXTERNAL_API',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC',
  SYSTEM: 'SYSTEM',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE'
};

/**
 * Base Error Class
 */
export class BaseError extends Error {
  constructor(message, code, severity = ERROR_SEVERITY.ERROR, category = ERROR_CATEGORY.SYSTEM, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.correlationId = this.generateCorrelationId();
    this.isOperational = true;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  generateCorrelationId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      stack: this.stack
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends BaseError {
  constructor(message, field = null, value = null, context = {}) {
    super(message, 'VALIDATION_ERROR', ERROR_SEVERITY.WARNING, ERROR_CATEGORY.VALIDATION, {
      field,
      value,
      ...context
    });
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends BaseError {
  constructor(message, context = {}) {
    super(message, 'AUTHENTICATION_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.AUTHENTICATION, context);
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends BaseError {
  constructor(message, resource = null, action = null, context = {}) {
    super(message, 'AUTHORIZATION_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.AUTHORIZATION, {
      resource,
      action,
      ...context
    });
  }
}

/**
 * Network Error
 */
export class NetworkError extends BaseError {
  constructor(message, url = null, statusCode = null, context = {}) {
    super(message, 'NETWORK_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.NETWORK, {
      url,
      statusCode,
      ...context
    });
  }
}

/**
 * Database Error
 */
export class DatabaseError extends BaseError {
  constructor(message, query = null, table = null, context = {}) {
    super(message, 'DATABASE_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.DATABASE, {
      query,
      table,
      ...context
    });
  }
}

/**
 * External API Error
 */
export class ExternalAPIError extends BaseError {
  constructor(message, service = null, endpoint = null, statusCode = null, context = {}) {
    super(message, 'EXTERNAL_API_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.EXTERNAL_API, {
      service,
      endpoint,
      statusCode,
      ...context
    });
  }
}

/**
 * Business Logic Error
 */
export class BusinessLogicError extends BaseError {
  constructor(message, operation = null, context = {}) {
    super(message, 'BUSINESS_LOGIC_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.BUSINESS_LOGIC, {
      operation,
      ...context
    });
  }
}

/**
 * Security Error
 */
export class SecurityError extends BaseError {
  constructor(message, threat = null, context = {}) {
    super(message, 'SECURITY_ERROR', ERROR_SEVERITY.CRITICAL, ERROR_CATEGORY.SECURITY, {
      threat,
      ...context
    });
  }
}

/**
 * Performance Error
 */
export class PerformanceError extends BaseError {
  constructor(message, metric = null, threshold = null, context = {}) {
    super(message, 'PERFORMANCE_ERROR', ERROR_SEVERITY.WARNING, ERROR_CATEGORY.PERFORMANCE, {
      metric,
      threshold,
      ...context
    });
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends BaseError {
  constructor(message, limit = null, remaining = null, resetTime = null, context = {}) {
    super(message, 'RATE_LIMIT_ERROR', ERROR_SEVERITY.WARNING, ERROR_CATEGORY.SYSTEM, {
      limit,
      remaining,
      resetTime,
      ...context
    });
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends BaseError {
  constructor(message, timeout = null, operation = null, context = {}) {
    super(message, 'TIMEOUT_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.PERFORMANCE, {
      timeout,
      operation,
      ...context
    });
  }
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends BaseError {
  constructor(message, service = null, state = null, context = {}) {
    super(message, 'CIRCUIT_BREAKER_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.EXTERNAL_API, {
      service,
      state,
      ...context
    });
  }
}

/**
 * Error Factory
 */
export class ErrorFactory {
  static createValidationError(message, field = null, value = null, context = {}) {
    return new ValidationError(message, field, value, context);
  }

  static createAuthenticationError(message, context = {}) {
    return new AuthenticationError(message, context);
  }

  static createAuthorizationError(message, resource = null, action = null, context = {}) {
    return new AuthorizationError(message, resource, action, context);
  }

  static createNetworkError(message, url = null, statusCode = null, context = {}) {
    return new NetworkError(message, url, statusCode, context);
  }

  static createDatabaseError(message, query = null, table = null, context = {}) {
    return new DatabaseError(message, query, table, context);
  }

  static createExternalAPIError(message, service = null, endpoint = null, statusCode = null, context = {}) {
    return new ExternalAPIError(message, service, endpoint, statusCode, context);
  }

  static createBusinessLogicError(message, operation = null, context = {}) {
    return new BusinessLogicError(message, operation, context);
  }

  static createSecurityError(message, threat = null, context = {}) {
    return new SecurityError(message, threat, context);
  }

  static createPerformanceError(message, metric = null, threshold = null, context = {}) {
    return new PerformanceError(message, metric, threshold, context);
  }

  static createRateLimitError(message, limit = null, remaining = null, resetTime = null, context = {}) {
    return new RateLimitError(message, limit, remaining, resetTime, context);
  }

  static createTimeoutError(message, timeout = null, operation = null, context = {}) {
    return new TimeoutError(message, timeout, operation, context);
  }

  static createCircuitBreakerError(message, service = null, state = null, context = {}) {
    return new CircuitBreakerError(message, service, state, context);
  }

  /**
   * Create error from unknown error
   */
  static fromUnknownError(error, context = {}) {
    if (error instanceof BaseError) {
      return error;
    }

    // Map common error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, null, null, context);
    }
    
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token', context);
    }
    
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token expired', context);
    }
    
    if (error.name === 'SequelizeValidationError') {
      return new ValidationError('Database validation failed', null, null, { originalError: error.message });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return new DatabaseError('Database operation failed', null, null, { originalError: error.message });
    }

    // Default to system error
    return new BaseError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR',
      ERROR_SEVERITY.ERROR,
      ERROR_CATEGORY.SYSTEM,
      { originalError: error.name, ...context }
    );
  }
}

/**
 * Error Response Formatter
 */
export class ErrorResponseFormatter {
  static format(error, includeStack = false, includeContext = true) {
    const baseResponse = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        severity: error.severity,
        category: error.category,
        timestamp: error.timestamp,
        correlationId: error.correlationId
      }
    };

    if (includeContext && error.context && Object.keys(error.context).length > 0) {
      baseResponse.error.context = error.context;
    }

    if (includeStack && error.stack) {
      baseResponse.error.stack = error.stack;
    }

    return baseResponse;
  }

  static formatForClient(error, userFriendlyMessage = null) {
    const response = {
      error: {
        message: userFriendlyMessage || this.getUserFriendlyMessage(error),
        code: error.code,
        correlationId: error.correlationId,
        timestamp: error.timestamp
      }
    };

    // Add retry information if applicable
    if (error.retryAfter) {
      response.error.retryAfter = error.retryAfter;
    }

    return response;
  }

  static getUserFriendlyMessage(error) {
    const friendlyMessages = {
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'AUTHENTICATION_ERROR': 'Please log in to continue.',
      'AUTHORIZATION_ERROR': 'You do not have permission to perform this action.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'DATABASE_ERROR': 'A database error occurred. Please try again later.',
      'EXTERNAL_API_ERROR': 'External service is temporarily unavailable.',
      'BUSINESS_LOGIC_ERROR': 'Unable to complete the requested operation.',
      'SECURITY_ERROR': 'Security violation detected.',
      'PERFORMANCE_ERROR': 'Request is taking longer than expected.',
      'RATE_LIMIT_ERROR': 'Too many requests. Please wait before trying again.',
      'TIMEOUT_ERROR': 'Request timed out. Please try again.',
      'CIRCUIT_BREAKER_ERROR': 'Service is temporarily unavailable. Please try again later.'
    };

    return friendlyMessages[error.code] || 'An unexpected error occurred. Please try again.';
  }
}

export default {
  ERROR_SEVERITY,
  ERROR_CATEGORY,
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  DatabaseError,
  ExternalAPIError,
  BusinessLogicError,
  SecurityError,
  PerformanceError,
  RateLimitError,
  TimeoutError,
  CircuitBreakerError,
  ErrorFactory,
  ErrorResponseFormatter
};
