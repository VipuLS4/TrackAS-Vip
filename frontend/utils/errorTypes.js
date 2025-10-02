// Client-Side Error Types and Error Factory
// Comprehensive error handling system for React/Next.js applications

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
  API: 'API',
  RENDERING: 'RENDERING',
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
    this.userFriendly = true;
    
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
 * API Error
 */
export class APIError extends BaseError {
  constructor(message, endpoint = null, statusCode = null, context = {}) {
    super(message, 'API_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.API, {
      endpoint,
      statusCode,
      ...context
    });
  }
}

/**
 * Rendering Error
 */
export class RenderingError extends BaseError {
  constructor(message, component = null, context = {}) {
    super(message, 'RENDERING_ERROR', ERROR_SEVERITY.ERROR, ERROR_CATEGORY.RENDERING, {
      component,
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

  static createAPIError(message, endpoint = null, statusCode = null, context = {}) {
    return new APIError(message, endpoint, statusCode, context);
  }

  static createRenderingError(message, component = null, context = {}) {
    return new RenderingError(message, component, context);
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

  static createTimeoutError(message, timeout = null, operation = null, context = {}) {
    return new TimeoutError(message, timeout, operation, context);
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
    
    if (error.name === 'TypeError') {
      return new RenderingError('Type error occurred', null, { originalError: error.message });
    }
    
    if (error.name === 'ReferenceError') {
      return new RenderingError('Reference error occurred', null, { originalError: error.message });
    }
    
    if (error.name === 'SyntaxError') {
      return new RenderingError('Syntax error occurred', null, { originalError: error.message });
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

  static formatForUser(error, userFriendlyMessage = null) {
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
      'API_ERROR': 'Service temporarily unavailable. Please try again later.',
      'RENDERING_ERROR': 'Something went wrong while loading this page.',
      'BUSINESS_LOGIC_ERROR': 'Unable to complete the requested operation.',
      'SECURITY_ERROR': 'Security issue detected. Please refresh the page.',
      'PERFORMANCE_ERROR': 'This is taking longer than expected.',
      'TIMEOUT_ERROR': 'Request timed out. Please try again.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
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
  APIError,
  RenderingError,
  BusinessLogicError,
  SecurityError,
  PerformanceError,
  TimeoutError,
  ErrorFactory,
  ErrorResponseFormatter
};
