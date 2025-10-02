// Vercel-Specific Error Types and Classification System
// Comprehensive error handling for all Vercel error codes and platform issues

/**
 * Vercel Error Categories
 */
export const VERCEL_ERROR_CATEGORY = {
  FUNCTION: 'Function',
  EDGE_FUNCTION: 'EdgeFunction',
  DEPLOYMENT: 'Deployment',
  DNS: 'DNS',
  REQUEST: 'Request',
  IMAGE: 'Image',
  ROUTING: 'Routing',
  CACHE: 'Cache',
  RUNTIME: 'Runtime',
  INTERNAL: 'Internal',
  MIDDLEWARE: 'Middleware',
  SANDBOX: 'Sandbox',
  PLATFORM: 'Platform'
};

/**
 * Vercel Error Codes
 */
export const VERCEL_ERROR_CODES = {
  // Function Errors
  FUNCTION_INVOCATION_FAILED: 'FUNCTION_INVOCATION_FAILED',
  FUNCTION_INVOCATION_TIMEOUT: 'FUNCTION_INVOCATION_TIMEOUT',
  FUNCTION_PAYLOAD_TOO_LARGE: 'FUNCTION_PAYLOAD_TOO_LARGE',
  FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE: 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE',
  FUNCTION_THROTTLED: 'FUNCTION_THROTTLED',
  NO_RESPONSE_FROM_FUNCTION: 'NO_RESPONSE_FROM_FUNCTION',
  BODY_NOT_A_STRING_FROM_FUNCTION: 'BODY_NOT_A_STRING_FROM_FUNCTION',
  INFINITE_LOOP_DETECTED: 'INFINITE_LOOP_DETECTED',
  
  // Edge Function Errors
  EDGE_FUNCTION_INVOCATION_FAILED: 'EDGE_FUNCTION_INVOCATION_FAILED',
  EDGE_FUNCTION_INVOCATION_TIMEOUT: 'EDGE_FUNCTION_INVOCATION_TIMEOUT',
  
  // Deployment Errors
  DEPLOYMENT_BLOCKED: 'DEPLOYMENT_BLOCKED',
  DEPLOYMENT_DELETED: 'DEPLOYMENT_DELETED',
  DEPLOYMENT_DISABLED: 'DEPLOYMENT_DISABLED',
  DEPLOYMENT_NOT_FOUND: 'DEPLOYMENT_NOT_FOUND',
  DEPLOYMENT_NOT_READY_REDIRECTING: 'DEPLOYMENT_NOT_READY_REDIRECTING',
  DEPLOYMENT_PAUSED: 'DEPLOYMENT_PAUSED',
  
  // DNS Errors
  DNS_HOSTNAME_EMPTY: 'DNS_HOSTNAME_EMPTY',
  DNS_HOSTNAME_NOT_FOUND: 'DNS_HOSTNAME_NOT_FOUND',
  DNS_HOSTNAME_RESOLVE_FAILED: 'DNS_HOSTNAME_RESOLVE_FAILED',
  DNS_HOSTNAME_RESOLVED_PRIVATE: 'DNS_HOSTNAME_RESOLVED_PRIVATE',
  DNS_HOSTNAME_SERVER_ERROR: 'DNS_HOSTNAME_SERVER_ERROR',
  
  // Request Errors
  INVALID_REQUEST_METHOD: 'INVALID_REQUEST_METHOD',
  MALFORMED_REQUEST_HEADER: 'MALFORMED_REQUEST_HEADER',
  REQUEST_HEADER_TOO_LARGE: 'REQUEST_HEADER_TOO_LARGE',
  URL_TOO_LONG: 'URL_TOO_LONG',
  RANGE_END_NOT_VALID: 'RANGE_END_NOT_VALID',
  RANGE_GROUP_NOT_VALID: 'RANGE_GROUP_NOT_VALID',
  RANGE_MISSING_UNIT: 'RANGE_MISSING_UNIT',
  RANGE_START_NOT_VALID: 'RANGE_START_NOT_VALID',
  RANGE_UNIT_NOT_SUPPORTED: 'RANGE_UNIT_NOT_SUPPORTED',
  TOO_MANY_RANGES: 'TOO_MANY_RANGES',
  
  // Router Errors
  ROUTER_CANNOT_MATCH: 'ROUTER_CANNOT_MATCH',
  ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR: 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR',
  ROUTER_EXTERNAL_TARGET_ERROR: 'ROUTER_EXTERNAL_TARGET_ERROR',
  ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR: 'ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR',
  ROUTER_TOO_MANY_HAS_SELECTIONS: 'ROUTER_TOO_MANY_HAS_SELECTIONS',
  
  // Image Optimization Errors
  INVALID_IMAGE_OPTIMIZE_REQUEST: 'INVALID_IMAGE_OPTIMIZE_REQUEST',
  OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED: 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED',
  OPTIMIZED_EXTERNAL_IMAGE_REQUEST_INVALID: 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_INVALID',
  OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED: 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED',
  OPTIMIZED_EXTERNAL_IMAGE_TOO_MANY_REDIRECTS: 'OPTIMIZED_EXTERNAL_IMAGE_TOO_MANY_REDIRECTS',
  
  // Middleware Errors
  MIDDLEWARE_INVOCATION_FAILED: 'MIDDLEWARE_INVOCATION_FAILED',
  MIDDLEWARE_INVOCATION_TIMEOUT: 'MIDDLEWARE_INVOCATION_TIMEOUT',
  MIDDLEWARE_RUNTIME_DEPRECATED: 'MIDDLEWARE_RUNTIME_DEPRECATED',
  MICROFRONTENDS_MIDDLEWARE_ERROR: 'MICROFRONTENDS_MIDDLEWARE_ERROR',
  
  // Cache Errors
  FALLBACK_BODY_TOO_LARGE: 'FALLBACK_BODY_TOO_LARGE',
  INTERNAL_CACHE_ERROR: 'INTERNAL_CACHE_ERROR',
  INTERNAL_MISSING_RESPONSE_FROM_CACHE: 'INTERNAL_MISSING_RESPONSE_FROM_CACHE',
  
  // Sandbox Errors
  SANDBOX_NOT_FOUND: 'SANDBOX_NOT_FOUND',
  SANDBOX_NOT_LISTENING: 'SANDBOX_NOT_LISTENING',
  SANDBOX_STOPPED: 'SANDBOX_STOPPED',
  
  // Filesystem Errors
  TOO_MANY_FILESYSTEM_CHECKS: 'TOO_MANY_FILESYSTEM_CHECKS',
  TOO_MANY_FORKS: 'TOO_MANY_FORKS',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  NOT_FOUND: 'NOT_FOUND'
};

/**
 * Vercel Error Severity Levels
 */
export const VERCEL_ERROR_SEVERITY = {
  CRITICAL: 'CRITICAL',    // System-threatening errors
  ERROR: 'ERROR',          // Function/deployment failures
  WARNING: 'WARNING',      // Performance issues
  INFO: 'INFO',           // Informational
  DEBUG: 'DEBUG'          // Debug information
};

/**
 * Base Vercel Error Class
 */
export class VercelError extends Error {
  constructor(message, code, category, severity = VERCEL_ERROR_SEVERITY.ERROR, context = {}) {
    super(message);
    this.name = 'VercelError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.correlationId = this.generateCorrelationId();
    this.platform = 'vercel';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  generateCorrelationId() {
    return `vercel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      platform: this.platform
    };
  }
}

/**
 * Function Error
 */
export class FunctionError extends VercelError {
  constructor(message, code, functionName = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.FUNCTION, VERCEL_ERROR_SEVERITY.ERROR, {
      functionName,
      ...context
    });
    this.name = 'FunctionError';
  }
}

/**
 * Edge Function Error
 */
export class EdgeFunctionError extends VercelError {
  constructor(message, code, functionName = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.EDGE_FUNCTION, VERCEL_ERROR_SEVERITY.ERROR, {
      functionName,
      ...context
    });
    this.name = 'EdgeFunctionError';
  }
}

/**
 * Deployment Error
 */
export class DeploymentError extends VercelError {
  constructor(message, code, deploymentId = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.DEPLOYMENT, VERCEL_ERROR_SEVERITY.ERROR, {
      deploymentId,
      ...context
    });
    this.name = 'DeploymentError';
  }
}

/**
 * DNSError
 */
export class DNSError extends VercelError {
  constructor(message, code, hostname = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.DNS, VERCEL_ERROR_SEVERITY.ERROR, {
      hostname,
      ...context
    });
    this.name = 'DNSError';
  }
}

/**
 * Request Error
 */
export class RequestError extends VercelError {
  constructor(message, code, method = null, url = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.REQUEST, VERCEL_ERROR_SEVERITY.WARNING, {
      method,
      url,
      ...context
    });
    this.name = 'RequestError';
  }
}

/**
 * Image Optimization Error
 */
export class ImageOptimizationError extends VercelError {
  constructor(message, code, imageUrl = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.IMAGE, VERCEL_ERROR_SEVERITY.WARNING, {
      imageUrl,
      ...context
    });
    this.name = 'ImageOptimizationError';
  }
}

/**
 * Routing Error
 */
export class RoutingError extends VercelError {
  constructor(message, code, route = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.ROUTING, VERCEL_ERROR_SEVERITY.ERROR, {
      route,
      ...context
    });
    this.name = 'RoutingError';
  }
}

/**
 * Cache Error
 */
export class CacheError extends VercelError {
  constructor(message, code, cacheKey = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.CACHE, VERCEL_ERROR_SEVERITY.WARNING, {
      cacheKey,
      ...context
    });
    this.name = 'CacheError';
  }
}

/**
 * Middleware Error
 */
export class MiddlewareError extends VercelError {
  constructor(message, code, middlewareName = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.MIDDLEWARE, VERCEL_ERROR_SEVERITY.ERROR, {
      middlewareName,
      ...context
    });
    this.name = 'MiddlewareError';
  }
}

/**
 * Sandbox Error
 */
export class SandboxError extends VercelError {
  constructor(message, code, sandboxId = null, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.SANDBOX, VERCEL_ERROR_SEVERITY.ERROR, {
      sandboxId,
      ...context
    });
    this.name = 'SandboxError';
  }
}

/**
 * Platform Error
 */
export class PlatformError extends VercelError {
  constructor(message, code, context = {}) {
    super(message, code, VERCEL_ERROR_CATEGORY.PLATFORM, VERCEL_ERROR_SEVERITY.CRITICAL, context);
    this.name = 'PlatformError';
  }
}

/**
 * Vercel Error Factory
 */
export class VercelErrorFactory {
  static createFunctionError(message, code, functionName = null, context = {}) {
    return new FunctionError(message, code, functionName, context);
  }

  static createEdgeFunctionError(message, code, functionName = null, context = {}) {
    return new EdgeFunctionError(message, code, functionName, context);
  }

  static createDeploymentError(message, code, deploymentId = null, context = {}) {
    return new DeploymentError(message, code, deploymentId, context);
  }

  static createDNSError(message, code, hostname = null, context = {}) {
    return new DNSError(message, code, hostname, context);
  }

  static createRequestError(message, code, method = null, url = null, context = {}) {
    return new RequestError(message, code, method, url, context);
  }

  static createImageOptimizationError(message, code, imageUrl = null, context = {}) {
    return new ImageOptimizationError(message, code, imageUrl, context);
  }

  static createRoutingError(message, code, route = null, context = {}) {
    return new RoutingError(message, code, route, context);
  }

  static createCacheError(message, code, cacheKey = null, context = {}) {
    return new CacheError(message, code, cacheKey, context);
  }

  static createMiddlewareError(message, code, middlewareName = null, context = {}) {
    return new MiddlewareError(message, code, middlewareName, context);
  }

  static createSandboxError(message, code, sandboxId = null, context = {}) {
    return new SandboxError(message, code, sandboxId, context);
  }

  static createPlatformError(message, code, context = {}) {
    return new PlatformError(message, code, context);
  }

  /**
   * Create error from Vercel error code
   */
  static fromVercelCode(vercelCode, context = {}) {
    const errorMappings = {
      [VERCEL_ERROR_CODES.FUNCTION_INVOCATION_FAILED]: () => 
        new FunctionError('Function invocation failed', vercelCode, null, context),
      [VERCEL_ERROR_CODES.FUNCTION_INVOCATION_TIMEOUT]: () => 
        new FunctionError('Function invocation timeout', vercelCode, null, context),
      [VERCEL_ERROR_CODES.FUNCTION_PAYLOAD_TOO_LARGE]: () => 
        new FunctionError('Function payload too large', vercelCode, null, context),
      [VERCEL_ERROR_CODES.FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE]: () => 
        new FunctionError('Function response payload too large', vercelCode, null, context),
      [VERCEL_ERROR_CODES.FUNCTION_THROTTLED]: () => 
        new FunctionError('Function throttled', vercelCode, null, context),
      [VERCEL_ERROR_CODES.NO_RESPONSE_FROM_FUNCTION]: () => 
        new FunctionError('No response from function', vercelCode, null, context),
      [VERCEL_ERROR_CODES.BODY_NOT_A_STRING_FROM_FUNCTION]: () => 
        new FunctionError('Body not a string from function', vercelCode, null, context),
      [VERCEL_ERROR_CODES.INFINITE_LOOP_DETECTED]: () => 
        new FunctionError('Infinite loop detected', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.EDGE_FUNCTION_INVOCATION_FAILED]: () => 
        new EdgeFunctionError('Edge function invocation failed', vercelCode, null, context),
      [VERCEL_ERROR_CODES.EDGE_FUNCTION_INVOCATION_TIMEOUT]: () => 
        new EdgeFunctionError('Edge function invocation timeout', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.DEPLOYMENT_BLOCKED]: () => 
        new DeploymentError('Deployment blocked', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DEPLOYMENT_DELETED]: () => 
        new DeploymentError('Deployment deleted', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DEPLOYMENT_DISABLED]: () => 
        new DeploymentError('Deployment disabled', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DEPLOYMENT_NOT_FOUND]: () => 
        new DeploymentError('Deployment not found', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DEPLOYMENT_NOT_READY_REDIRECTING]: () => 
        new DeploymentError('Deployment not ready, redirecting', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DEPLOYMENT_PAUSED]: () => 
        new DeploymentError('Deployment paused', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.DNS_HOSTNAME_EMPTY]: () => 
        new DNSError('DNS hostname empty', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DNS_HOSTNAME_NOT_FOUND]: () => 
        new DNSError('DNS hostname not found', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DNS_HOSTNAME_RESOLVE_FAILED]: () => 
        new DNSError('DNS hostname resolve failed', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DNS_HOSTNAME_RESOLVED_PRIVATE]: () => 
        new DNSError('DNS hostname resolved to private IP', vercelCode, null, context),
      [VERCEL_ERROR_CODES.DNS_HOSTNAME_SERVER_ERROR]: () => 
        new DNSError('DNS hostname server error', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.INVALID_REQUEST_METHOD]: () => 
        new RequestError('Invalid request method', vercelCode, null, null, context),
      [VERCEL_ERROR_CODES.MALFORMED_REQUEST_HEADER]: () => 
        new RequestError('Malformed request header', vercelCode, null, null, context),
      [VERCEL_ERROR_CODES.REQUEST_HEADER_TOO_LARGE]: () => 
        new RequestError('Request header too large', vercelCode, null, null, context),
      [VERCEL_ERROR_CODES.URL_TOO_LONG]: () => 
        new RequestError('URL too long', vercelCode, null, null, context),
      
      [VERCEL_ERROR_CODES.ROUTER_CANNOT_MATCH]: () => 
        new RoutingError('Router cannot match', vercelCode, null, context),
      [VERCEL_ERROR_CODES.ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR]: () => 
        new RoutingError('Router external target connection error', vercelCode, null, context),
      [VERCEL_ERROR_CODES.ROUTER_EXTERNAL_TARGET_ERROR]: () => 
        new RoutingError('Router external target error', vercelCode, null, context),
      [VERCEL_ERROR_CODES.ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR]: () => 
        new RoutingError('Router external target handshake error', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.INVALID_IMAGE_OPTIMIZE_REQUEST]: () => 
        new ImageOptimizationError('Invalid image optimize request', vercelCode, null, context),
      [VERCEL_ERROR_CODES.OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED]: () => 
        new ImageOptimizationError('Optimized external image request failed', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.MIDDLEWARE_INVOCATION_FAILED]: () => 
        new MiddlewareError('Middleware invocation failed', vercelCode, null, context),
      [VERCEL_ERROR_CODES.MIDDLEWARE_INVOCATION_TIMEOUT]: () => 
        new MiddlewareError('Middleware invocation timeout', vercelCode, null, context),
      [VERCEL_ERROR_CODES.MIDDLEWARE_RUNTIME_DEPRECATED]: () => 
        new MiddlewareError('Middleware runtime deprecated', vercelCode, null, context),
      [VERCEL_ERROR_CODES.MICROFRONTENDS_MIDDLEWARE_ERROR]: () => 
        new MiddlewareError('Microfrontends middleware error', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.FALLBACK_BODY_TOO_LARGE]: () => 
        new CacheError('Fallback body too large', vercelCode, null, context),
      [VERCEL_ERROR_CODES.INTERNAL_CACHE_ERROR]: () => 
        new CacheError('Internal cache error', vercelCode, null, context),
      [VERCEL_ERROR_CODES.INTERNAL_MISSING_RESPONSE_FROM_CACHE]: () => 
        new CacheError('Internal missing response from cache', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.SANDBOX_NOT_FOUND]: () => 
        new SandboxError('Sandbox not found', vercelCode, null, context),
      [VERCEL_ERROR_CODES.SANDBOX_NOT_LISTENING]: () => 
        new SandboxError('Sandbox not listening', vercelCode, null, context),
      [VERCEL_ERROR_CODES.SANDBOX_STOPPED]: () => 
        new SandboxError('Sandbox stopped', vercelCode, null, context),
      
      [VERCEL_ERROR_CODES.TOO_MANY_FILESYSTEM_CHECKS]: () => 
        new PlatformError('Too many filesystem checks', vercelCode, context),
      [VERCEL_ERROR_CODES.TOO_MANY_FORKS]: () => 
        new PlatformError('Too many forks', vercelCode, context),
      
      [VERCEL_ERROR_CODES.RESOURCE_NOT_FOUND]: () => 
        new PlatformError('Resource not found', vercelCode, context),
      [VERCEL_ERROR_CODES.NOT_FOUND]: () => 
        new PlatformError('Not found', vercelCode, context)
    };

    const errorCreator = errorMappings[vercelCode];
    if (errorCreator) {
      return errorCreator();
    }

    // Default to platform error for unknown codes
    return new PlatformError(`Unknown Vercel error: ${vercelCode}`, vercelCode, context);
  }
}

/**
 * Vercel Error Response Formatter
 */
export class VercelErrorResponseFormatter {
  static format(error, includeStack = false, includeContext = true) {
    const baseResponse = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        category: error.category,
        severity: error.severity,
        platform: error.platform,
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
        category: error.category,
        correlationId: error.correlationId,
        timestamp: error.timestamp
      }
    };

    // Add retry information if applicable
    if (error.retryAfter) {
      response.error.retryAfter = error.retryAfter;
    }

    // Add Vercel-specific information
    if (error.platform === 'vercel') {
      response.error.platform = 'vercel';
    }

    return response;
  }

  static getUserFriendlyMessage(error) {
    const friendlyMessages = {
      // Function errors
      'FUNCTION_INVOCATION_FAILED': 'Service temporarily unavailable. Please try again.',
      'FUNCTION_INVOCATION_TIMEOUT': 'Request is taking longer than expected. Please try again.',
      'FUNCTION_PAYLOAD_TOO_LARGE': 'Request is too large. Please reduce the size and try again.',
      'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE': 'Response is too large. Please contact support.',
      'FUNCTION_THROTTLED': 'Too many requests. Please wait a moment and try again.',
      'NO_RESPONSE_FROM_FUNCTION': 'Service is not responding. Please try again later.',
      'BODY_NOT_A_STRING_FROM_FUNCTION': 'Invalid response format. Please try again.',
      'INFINITE_LOOP_DETECTED': 'Request processing error. Please try again.',
      
      // Deployment errors
      'DEPLOYMENT_BLOCKED': 'Service is temporarily unavailable due to maintenance.',
      'DEPLOYMENT_DELETED': 'Service has been removed. Please contact support.',
      'DEPLOYMENT_DISABLED': 'Service is currently disabled. Please contact support.',
      'DEPLOYMENT_NOT_FOUND': 'Service not found. Please check the URL.',
      'DEPLOYMENT_NOT_READY_REDIRECTING': 'Service is starting up. Please wait a moment.',
      'DEPLOYMENT_PAUSED': 'Service is paused. Please try again later.',
      
      // DNS errors
      'DNS_HOSTNAME_EMPTY': 'Invalid hostname. Please check the URL.',
      'DNS_HOSTNAME_NOT_FOUND': 'Hostname not found. Please check the URL.',
      'DNS_HOSTNAME_RESOLVE_FAILED': 'Unable to resolve hostname. Please try again.',
      'DNS_HOSTNAME_RESOLVED_PRIVATE': 'Invalid hostname. Please use a public URL.',
      'DNS_HOSTNAME_SERVER_ERROR': 'DNS server error. Please try again.',
      
      // Request errors
      'INVALID_REQUEST_METHOD': 'Invalid request method. Please check your request.',
      'MALFORMED_REQUEST_HEADER': 'Invalid request headers. Please check your request.',
      'REQUEST_HEADER_TOO_LARGE': 'Request headers are too large. Please reduce header size.',
      'URL_TOO_LONG': 'URL is too long. Please use a shorter URL.',
      
      // Router errors
      'ROUTER_CANNOT_MATCH': 'Route not found. Please check the URL.',
      'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR': 'External service connection failed. Please try again.',
      'ROUTER_EXTERNAL_TARGET_ERROR': 'External service error. Please try again.',
      'ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR': 'External service handshake failed. Please try again.',
      
      // Image optimization errors
      'INVALID_IMAGE_OPTIMIZE_REQUEST': 'Invalid image request. Please check the image URL.',
      'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED': 'Image optimization failed. Please try again.',
      
      // Middleware errors
      'MIDDLEWARE_INVOCATION_FAILED': 'Middleware error. Please try again.',
      'MIDDLEWARE_INVOCATION_TIMEOUT': 'Middleware timeout. Please try again.',
      'MIDDLEWARE_RUNTIME_DEPRECATED': 'Service is being updated. Please try again later.',
      'MICROFRONTENDS_MIDDLEWARE_ERROR': 'Service error. Please try again.',
      
      // Cache errors
      'FALLBACK_BODY_TOO_LARGE': 'Response too large. Please contact support.',
      'INTERNAL_CACHE_ERROR': 'Cache error. Please try again.',
      'INTERNAL_MISSING_RESPONSE_FROM_CACHE': 'Cache miss. Please try again.',
      
      // Sandbox errors
      'SANDBOX_NOT_FOUND': 'Development environment not found. Please contact support.',
      'SANDBOX_NOT_LISTENING': 'Development environment not responding. Please try again.',
      'SANDBOX_STOPPED': 'Development environment stopped. Please contact support.',
      
      // Platform errors
      'TOO_MANY_FILESYSTEM_CHECKS': 'System resource limit exceeded. Please try again later.',
      'TOO_MANY_FORKS': 'System resource limit exceeded. Please try again later.',
      'RESOURCE_NOT_FOUND': 'Resource not found. Please check the URL.',
      'NOT_FOUND': 'Not found. Please check the URL.'
    };

    return friendlyMessages[error.code] || 'An unexpected error occurred. Please try again.';
  }
}

export default {
  VERCEL_ERROR_CATEGORY,
  VERCEL_ERROR_CODES,
  VERCEL_ERROR_SEVERITY,
  VercelError,
  FunctionError,
  EdgeFunctionError,
  DeploymentError,
  DNSError,
  RequestError,
  ImageOptimizationError,
  RoutingError,
  CacheError,
  MiddlewareError,
  SandboxError,
  PlatformError,
  VercelErrorFactory,
  VercelErrorResponseFormatter
};

