// Vercel-specific error handling middleware
import logger from '../utils/logger.js';

export function vercelErrorHandler(err, req, res, next) {
  // Log the error
  logger.error('Vercel Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  // Handle specific Vercel errors
  if (err.code === 'FUNCTION_INVOCATION_FAILED') {
    const errorResponse = {
      error: 'Function invocation failed',
      message: 'The server function encountered an error',
      code: 'FUNCTION_INVOCATION_FAILED'
    };
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).send(JSON.stringify(errorResponse));
  }

  if (err.code === 'FUNCTION_INVOCATION_TIMEOUT') {
    return res.status(504).json({
      error: 'Function timeout',
      message: 'The request took too long to process',
      code: 'FUNCTION_INVOCATION_TIMEOUT'
    });
  }

  if (err.code === 'FUNCTION_PAYLOAD_TOO_LARGE') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request body exceeds size limit',
      code: 'FUNCTION_PAYLOAD_TOO_LARGE'
    });
  }

  if (err.code === 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE') {
    return res.status(500).json({
      error: 'Response too large',
      message: 'Response exceeds size limit',
      code: 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE'
    });
  }

  if (err.code === 'FUNCTION_THROTTLED') {
    return res.status(503).json({
      error: 'Function throttled',
      message: 'Too many requests, please try again later',
      code: 'FUNCTION_THROTTLED'
    });
  }

  if (err.code === 'NO_RESPONSE_FROM_FUNCTION') {
    return res.status(502).json({
      error: 'No response from function',
      message: 'The server function did not respond',
      code: 'NO_RESPONSE_FROM_FUNCTION'
    });
  }

  if (err.code === 'BODY_NOT_A_STRING_FROM_FUNCTION') {
    return res.status(502).json({
      error: 'Invalid response format',
      message: 'Server returned invalid response format',
      code: 'BODY_NOT_A_STRING_FROM_FUNCTION'
    });
  }

  // Handle routing errors
  if (err.code === 'ROUTER_CANNOT_MATCH') {
    return res.status(502).json({
      error: 'Routing error',
      message: 'Unable to match request to handler',
      code: 'ROUTER_CANNOT_MATCH'
    });
  }

  if (err.code === 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR') {
    return res.status(502).json({
      error: 'External connection failed',
      message: 'Unable to connect to external service',
      code: 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR'
    });
  }

  // Handle request errors
  if (err.code === 'INVALID_REQUEST_METHOD') {
    return res.status(405).json({
      error: 'Invalid request method',
      message: 'Method not allowed',
      code: 'INVALID_REQUEST_METHOD'
    });
  }

  if (err.code === 'MALFORMED_REQUEST_HEADER') {
    return res.status(400).json({
      error: 'Malformed request header',
      message: 'Invalid request headers',
      code: 'MALFORMED_REQUEST_HEADER'
    });
  }

  if (err.code === 'REQUEST_HEADER_TOO_LARGE') {
    return res.status(431).json({
      error: 'Request header too large',
      message: 'Request headers exceed size limit',
      code: 'REQUEST_HEADER_TOO_LARGE'
    });
  }

  if (err.code === 'URL_TOO_LONG') {
    return res.status(414).json({
      error: 'URL too long',
      message: 'Request URL exceeds length limit',
      code: 'URL_TOO_LONG'
    });
  }

  // Handle range request errors
  if (err.code === 'RANGE_END_NOT_VALID' || 
      err.code === 'RANGE_GROUP_NOT_VALID' ||
      err.code === 'RANGE_MISSING_UNIT' ||
      err.code === 'RANGE_START_NOT_VALID' ||
      err.code === 'RANGE_UNIT_NOT_SUPPORTED' ||
      err.code === 'TOO_MANY_RANGES') {
    return res.status(416).json({
      error: 'Range request error',
      message: 'Invalid range request',
      code: err.code
    });
  }

  // Handle resource errors
  if (err.code === 'RESOURCE_NOT_FOUND') {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'The requested resource was not found',
      code: 'RESOURCE_NOT_FOUND'
    });
  }

  // Handle infinite loop detection
  if (err.code === 'INFINITE_LOOP_DETECTED') {
    return res.status(508).json({
      error: 'Infinite loop detected',
      message: 'Server detected infinite loop, request terminated',
      code: 'INFINITE_LOOP_DETECTED'
    });
  }

  // Handle image optimization errors
  if (err.code === 'INVALID_IMAGE_OPTIMIZE_REQUEST' ||
      err.code === 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED' ||
      err.code === 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_INVALID' ||
      err.code === 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED' ||
      err.code === 'OPTIMIZED_EXTERNAL_IMAGE_TOO_MANY_REDIRECTS') {
    return res.status(400).json({
      error: 'Image optimization error',
      message: 'Failed to optimize image',
      code: err.code
    });
  }

  // Handle middleware errors
  if (err.code === 'MIDDLEWARE_INVOCATION_FAILED') {
    return res.status(500).json({
      error: 'Middleware error',
      message: 'Middleware function failed',
      code: 'MIDDLEWARE_INVOCATION_FAILED'
    });
  }

  if (err.code === 'MIDDLEWARE_INVOCATION_TIMEOUT') {
    return res.status(504).json({
      error: 'Middleware timeout',
      message: 'Middleware function timed out',
      code: 'MIDDLEWARE_INVOCATION_TIMEOUT'
    });
  }

  if (err.code === 'MIDDLEWARE_RUNTIME_DEPRECATED') {
    return res.status(503).json({
      error: 'Middleware runtime deprecated',
      message: 'Middleware runtime is no longer supported',
      code: 'MIDDLEWARE_RUNTIME_DEPRECATED'
    });
  }

  // Handle sandbox errors
  if (err.code === 'SANDBOX_NOT_FOUND') {
    return res.status(404).json({
      error: 'Sandbox not found',
      message: 'Development sandbox not available',
      code: 'SANDBOX_NOT_FOUND'
    });
  }

  if (err.code === 'SANDBOX_NOT_LISTENING') {
    return res.status(502).json({
      error: 'Sandbox not listening',
      message: 'Development sandbox is not responding',
      code: 'SANDBOX_NOT_LISTENING'
    });
  }

  if (err.code === 'SANDBOX_STOPPED') {
    return res.status(410).json({
      error: 'Sandbox stopped',
      message: 'Development sandbox has been stopped',
      code: 'SANDBOX_STOPPED'
    });
  }

  // Handle deployment errors
  if (err.code === 'DEPLOYMENT_BLOCKED') {
    return res.status(403).json({
      error: 'Deployment blocked',
      message: 'Deployment is blocked due to configuration issues',
      code: 'DEPLOYMENT_BLOCKED'
    });
  }

  if (err.code === 'DEPLOYMENT_DELETED') {
    return res.status(410).json({
      error: 'Deployment deleted',
      message: 'Deployment has been deleted',
      code: 'DEPLOYMENT_DELETED'
    });
  }

  if (err.code === 'DEPLOYMENT_DISABLED') {
    return res.status(402).json({
      error: 'Deployment disabled',
      message: 'Deployment is disabled',
      code: 'DEPLOYMENT_DISABLED'
    });
  }

  if (err.code === 'DEPLOYMENT_NOT_FOUND') {
    return res.status(404).json({
      error: 'Deployment not found',
      message: 'Deployment not found',
      code: 'DEPLOYMENT_NOT_FOUND'
    });
  }

  if (err.code === 'DEPLOYMENT_NOT_READY_REDIRECTING') {
    return res.status(303).json({
      error: 'Deployment not ready',
      message: 'Deployment is not ready, redirecting',
      code: 'DEPLOYMENT_NOT_READY_REDIRECTING'
    });
  }

  if (err.code === 'DEPLOYMENT_PAUSED') {
    return res.status(503).json({
      error: 'Deployment paused',
      message: 'Deployment is paused',
      code: 'DEPLOYMENT_PAUSED'
    });
  }

  // Handle DNS errors
  if (err.code === 'DNS_HOSTNAME_EMPTY' ||
      err.code === 'DNS_HOSTNAME_NOT_FOUND' ||
      err.code === 'DNS_HOSTNAME_RESOLVE_FAILED' ||
      err.code === 'DNS_HOSTNAME_RESOLVED_PRIVATE' ||
      err.code === 'DNS_HOSTNAME_SERVER_ERROR') {
    return res.status(502).json({
      error: 'DNS resolution error',
      message: 'Unable to resolve hostname',
      code: err.code
    });
  }

  // Handle cache errors
  if (err.code === 'FALLBACK_BODY_TOO_LARGE') {
    return res.status(502).json({
      error: 'Cache body too large',
      message: 'Cached response body exceeds size limit',
      code: 'FALLBACK_BODY_TOO_LARGE'
    });
  }

  // Handle filesystem errors
  if (err.code === 'TOO_MANY_FILESYSTEM_CHECKS') {
    return res.status(502).json({
      error: 'Too many filesystem checks',
      message: 'Exceeded filesystem check limit',
      code: 'TOO_MANY_FILESYSTEM_CHECKS'
    });
  }

  if (err.code === 'TOO_MANY_FORKS') {
    return res.status(502).json({
      error: 'Too many forks',
      message: 'Exceeded fork limit',
      code: 'TOO_MANY_FORKS'
    });
  }

  // Handle microfrontends errors
  if (err.code === 'MICROFRONTENDS_MIDDLEWARE_ERROR') {
    return res.status(500).json({
      error: 'Microfrontends middleware error',
      message: 'Microfrontends middleware failed',
      code: 'MICROFRONTENDS_MIDDLEWARE_ERROR'
    });
  }

  // Default error handler
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  });
}

// Request size limiter to prevent FUNCTION_PAYLOAD_TOO_LARGE
export function requestSizeLimiter(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Payload too large',
        message: `Request body exceeds ${maxSize} limit`,
        code: 'FUNCTION_PAYLOAD_TOO_LARGE'
      });
    }
    
    next();
  };
}

// Response size limiter to prevent FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE
export function responseSizeLimiter(maxSize = '6mb') {
  return (req, res, next) => {
    const originalSend = res.send;
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
    
    res.send = function(data) {
      if (data && data.length > maxSizeBytes) {
        return res.status(500).json({
          error: 'Response too large',
          message: `Response exceeds ${maxSize} limit`,
          code: 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE'
        });
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Timeout handler to prevent FUNCTION_INVOCATION_TIMEOUT
export function timeoutHandler(timeout = 25000) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Request timeout',
          message: 'Request took too long to process',
          code: 'FUNCTION_INVOCATION_TIMEOUT'
        });
      }
    }, timeout);
    
    res.on('finish', () => clearTimeout(timer));
    next();
  };
}
