// Complete Vercel Error Prevention System
// Handles ALL Vercel error codes with proper string responses
import logger from '../utils/logger.js';

export function completeVercelErrorHandler(err, req, res, next) {
  // Log the error with full context
  logger.error('Vercel Error Detected:', {
    error: err.message,
    code: err.code,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Helper function to send guaranteed string responses
  function sendStringResponse(statusCode, data) {
    try {
      const responseString = JSON.stringify(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(responseString));
      res.status(statusCode).send(responseString);
    } catch (stringifyError) {
      logger.error('String response failed:', stringifyError);
      // Ultimate fallback - plain text
      res.setHeader('Content-Type', 'text/plain');
      res.status(500).send('Internal server error');
    }
  }

  // ===========================================
  // FUNCTION ERRORS (500/502/503/504)
  // ===========================================

  if (err.code === 'FUNCTION_INVOCATION_FAILED') {
    return sendStringResponse(500, {
      error: 'Function invocation failed',
      message: 'The server function encountered an error',
      code: 'FUNCTION_INVOCATION_FAILED',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'FUNCTION_INVOCATION_TIMEOUT') {
    return sendStringResponse(504, {
      error: 'Function timeout',
      message: 'The request took too long to process',
      code: 'FUNCTION_INVOCATION_TIMEOUT',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'FUNCTION_PAYLOAD_TOO_LARGE') {
    return sendStringResponse(413, {
      error: 'Payload too large',
      message: 'Request body exceeds size limit',
      code: 'FUNCTION_PAYLOAD_TOO_LARGE',
      maxSize: '10MB',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE') {
    return sendStringResponse(500, {
      error: 'Response too large',
      message: 'Response exceeds size limit',
      code: 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE',
      maxSize: '6MB',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'FUNCTION_THROTTLED') {
    return sendStringResponse(503, {
      error: 'Function throttled',
      message: 'Too many requests, please try again later',
      code: 'FUNCTION_THROTTLED',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'NO_RESPONSE_FROM_FUNCTION') {
    return sendStringResponse(502, {
      error: 'No response from function',
      message: 'The server function did not respond',
      code: 'NO_RESPONSE_FROM_FUNCTION',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'BODY_NOT_A_STRING_FROM_FUNCTION') {
    return sendStringResponse(502, {
      error: 'Invalid response format',
      message: 'Server returned invalid response format',
      code: 'BODY_NOT_A_STRING_FROM_FUNCTION',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // EDGE FUNCTION ERRORS (500/504)
  // ===========================================

  if (err.code === 'EDGE_FUNCTION_INVOCATION_FAILED') {
    return sendStringResponse(500, {
      error: 'Edge function invocation failed',
      message: 'Edge function encountered an error',
      code: 'EDGE_FUNCTION_INVOCATION_FAILED',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'EDGE_FUNCTION_INVOCATION_TIMEOUT') {
    return sendStringResponse(504, {
      error: 'Edge function timeout',
      message: 'Edge function took too long to execute',
      code: 'EDGE_FUNCTION_INVOCATION_TIMEOUT',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // DEPLOYMENT ERRORS (303/402/403/404/410/503)
  // ===========================================

  if (err.code === 'DEPLOYMENT_BLOCKED') {
    return sendStringResponse(403, {
      error: 'Deployment blocked',
      message: 'Deployment is blocked due to configuration issues',
      code: 'DEPLOYMENT_BLOCKED',
      action: 'Check deployment configuration',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DEPLOYMENT_DELETED') {
    return sendStringResponse(410, {
      error: 'Deployment deleted',
      message: 'Deployment has been deleted',
      code: 'DEPLOYMENT_DELETED',
      action: 'Redeploy the application',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DEPLOYMENT_DISABLED') {
    return sendStringResponse(402, {
      error: 'Deployment disabled',
      message: 'Deployment is disabled',
      code: 'DEPLOYMENT_DISABLED',
      action: 'Enable deployment in Vercel dashboard',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DEPLOYMENT_NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Deployment not found',
      message: 'Deployment not found',
      code: 'DEPLOYMENT_NOT_FOUND',
      action: 'Check deployment URL',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DEPLOYMENT_NOT_READY_REDIRECTING') {
    return sendStringResponse(303, {
      error: 'Deployment not ready',
      message: 'Deployment is not ready, redirecting',
      code: 'DEPLOYMENT_NOT_READY_REDIRECTING',
      action: 'Wait for deployment to complete',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DEPLOYMENT_PAUSED') {
    return sendStringResponse(503, {
      error: 'Deployment paused',
      message: 'Deployment is paused',
      code: 'DEPLOYMENT_PAUSED',
      action: 'Resume deployment in Vercel dashboard',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // DNS ERRORS (404/502)
  // ===========================================

  if (err.code === 'DNS_HOSTNAME_EMPTY') {
    return sendStringResponse(502, {
      error: 'DNS hostname empty',
      message: 'Hostname is empty',
      code: 'DNS_HOSTNAME_EMPTY',
      action: 'Check hostname configuration',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DNS_HOSTNAME_NOT_FOUND') {
    return sendStringResponse(502, {
      error: 'DNS hostname not found',
      message: 'Unable to resolve hostname',
      code: 'DNS_HOSTNAME_NOT_FOUND',
      action: 'Check DNS configuration',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DNS_HOSTNAME_RESOLVE_FAILED') {
    return sendStringResponse(502, {
      error: 'DNS resolution failed',
      message: 'Failed to resolve hostname',
      code: 'DNS_HOSTNAME_RESOLVE_FAILED',
      action: 'Check DNS settings',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DNS_HOSTNAME_RESOLVED_PRIVATE') {
    return sendStringResponse(404, {
      error: 'Private hostname resolved',
      message: 'Hostname resolved to private IP',
      code: 'DNS_HOSTNAME_RESOLVED_PRIVATE',
      action: 'Use public hostname',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'DNS_HOSTNAME_SERVER_ERROR') {
    return sendStringResponse(502, {
      error: 'DNS server error',
      message: 'DNS server encountered an error',
      code: 'DNS_HOSTNAME_SERVER_ERROR',
      action: 'Retry request later',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // REQUEST ERRORS (400/405/414/416/431)
  // ===========================================

  if (err.code === 'INVALID_REQUEST_METHOD') {
    return sendStringResponse(405, {
      error: 'Invalid request method',
      message: 'Method not allowed',
      code: 'INVALID_REQUEST_METHOD',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'MALFORMED_REQUEST_HEADER') {
    return sendStringResponse(400, {
      error: 'Malformed request header',
      message: 'Invalid request headers',
      code: 'MALFORMED_REQUEST_HEADER',
      action: 'Check request headers',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'REQUEST_HEADER_TOO_LARGE') {
    return sendStringResponse(431, {
      error: 'Request header too large',
      message: 'Request headers exceed size limit',
      code: 'REQUEST_HEADER_TOO_LARGE',
      maxSize: '8KB',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'URL_TOO_LONG') {
    return sendStringResponse(414, {
      error: 'URL too long',
      message: 'Request URL exceeds length limit',
      code: 'URL_TOO_LONG',
      maxLength: '2048 characters',
      timestamp: new Date().toISOString()
    });
  }

  // Range request errors
  if (err.code === 'RANGE_END_NOT_VALID' ||
      err.code === 'RANGE_GROUP_NOT_VALID' ||
      err.code === 'RANGE_MISSING_UNIT' ||
      err.code === 'RANGE_START_NOT_VALID' ||
      err.code === 'RANGE_UNIT_NOT_SUPPORTED' ||
      err.code === 'TOO_MANY_RANGES') {
    return sendStringResponse(416, {
      error: 'Range request error',
      message: 'Invalid range request',
      code: err.code,
      action: 'Check range request format',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // ROUTING ERRORS (502)
  // ===========================================

  if (err.code === 'ROUTER_CANNOT_MATCH') {
    return sendStringResponse(502, {
      error: 'Routing error',
      message: 'Unable to match request to handler',
      code: 'ROUTER_CANNOT_MATCH',
      action: 'Check routing configuration',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR') {
    return sendStringResponse(502, {
      error: 'External connection failed',
      message: 'Unable to connect to external service',
      code: 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR',
      action: 'Check external service availability',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'ROUTER_EXTERNAL_TARGET_ERROR') {
    return sendStringResponse(502, {
      error: 'External target error',
      message: 'External service returned an error',
      code: 'ROUTER_EXTERNAL_TARGET_ERROR',
      action: 'Check external service status',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR') {
    return sendStringResponse(502, {
      error: 'External handshake error',
      message: 'Failed to establish connection with external service',
      code: 'ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR',
      action: 'Check external service configuration',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'ROUTER_TOO_MANY_HAS_SELECTIONS') {
    return sendStringResponse(502, {
      error: 'Too many route selections',
      message: 'Router has too many selection criteria',
      code: 'ROUTER_TOO_MANY_HAS_SELECTIONS',
      action: 'Simplify routing configuration',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // MIDDLEWARE ERRORS (500/503/504)
  // ===========================================

  if (err.code === 'MIDDLEWARE_INVOCATION_FAILED') {
    return sendStringResponse(500, {
      error: 'Middleware error',
      message: 'Middleware function failed',
      code: 'MIDDLEWARE_INVOCATION_FAILED',
      action: 'Check middleware implementation',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'MIDDLEWARE_INVOCATION_TIMEOUT') {
    return sendStringResponse(504, {
      error: 'Middleware timeout',
      message: 'Middleware function timed out',
      code: 'MIDDLEWARE_INVOCATION_TIMEOUT',
      action: 'Optimize middleware performance',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'MIDDLEWARE_RUNTIME_DEPRECATED') {
    return sendStringResponse(503, {
      error: 'Middleware runtime deprecated',
      message: 'Middleware runtime is no longer supported',
      code: 'MIDDLEWARE_RUNTIME_DEPRECATED',
      action: 'Update middleware runtime',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'MICROFRONTENDS_MIDDLEWARE_ERROR') {
    return sendStringResponse(500, {
      error: 'Microfrontends middleware error',
      message: 'Microfrontends middleware failed',
      code: 'MICROFRONTENDS_MIDDLEWARE_ERROR',
      action: 'Check microfrontends configuration',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // SANDBOX ERRORS (404/410/502)
  // ===========================================

  if (err.code === 'SANDBOX_NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Sandbox not found',
      message: 'Development sandbox not available',
      code: 'SANDBOX_NOT_FOUND',
      action: 'Check sandbox configuration',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'SANDBOX_NOT_LISTENING') {
    return sendStringResponse(502, {
      error: 'Sandbox not listening',
      message: 'Development sandbox is not responding',
      code: 'SANDBOX_NOT_LISTENING',
      action: 'Restart sandbox',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'SANDBOX_STOPPED') {
    return sendStringResponse(410, {
      error: 'Sandbox stopped',
      message: 'Development sandbox has been stopped',
      code: 'SANDBOX_STOPPED',
      action: 'Start sandbox',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // IMAGE OPTIMIZATION ERRORS (400/502)
  // ===========================================

  if (err.code === 'INVALID_IMAGE_OPTIMIZE_REQUEST') {
    return sendStringResponse(400, {
      error: 'Invalid image optimization request',
      message: 'Image optimization request is invalid',
      code: 'INVALID_IMAGE_OPTIMIZE_REQUEST',
      action: 'Check image optimization parameters',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED') {
    return sendStringResponse(502, {
      error: 'External image optimization failed',
      message: 'Failed to optimize external image',
      code: 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_FAILED',
      action: 'Check external image URL',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_INVALID') {
    return sendStringResponse(502, {
      error: 'Invalid external image request',
      message: 'External image request is invalid',
      code: 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_INVALID',
      action: 'Check external image parameters',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED') {
    return sendStringResponse(502, {
      error: 'Unauthorized external image request',
      message: 'External image request is unauthorized',
      code: 'OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED',
      action: 'Check external image permissions',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'OPTIMIZED_EXTERNAL_IMAGE_TOO_MANY_REDIRECTS') {
    return sendStringResponse(502, {
      error: 'Too many redirects for external image',
      message: 'External image has too many redirects',
      code: 'OPTIMIZED_EXTERNAL_IMAGE_TOO_MANY_REDIRECTS',
      action: 'Check external image URL redirects',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // CACHE ERRORS (502)
  // ===========================================

  if (err.code === 'FALLBACK_BODY_TOO_LARGE') {
    return sendStringResponse(502, {
      error: 'Cache body too large',
      message: 'Cached response body exceeds size limit',
      code: 'FALLBACK_BODY_TOO_LARGE',
      action: 'Reduce response size',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // RUNTIME ERRORS (508/503)
  // ===========================================

  if (err.code === 'INFINITE_LOOP_DETECTED') {
    return sendStringResponse(508, {
      error: 'Infinite loop detected',
      message: 'Server detected infinite loop, request terminated',
      code: 'INFINITE_LOOP_DETECTED',
      action: 'Check application logic for loops',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // RESOURCE ERRORS (404)
  // ===========================================

  if (err.code === 'RESOURCE_NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Resource not found',
      message: 'The requested resource was not found',
      code: 'RESOURCE_NOT_FOUND',
      action: 'Check resource URL',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Not found',
      message: 'The requested resource was not found',
      code: 'NOT_FOUND',
      action: 'Check URL path',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // FILESYSTEM ERRORS (502)
  // ===========================================

  if (err.code === 'TOO_MANY_FILESYSTEM_CHECKS') {
    return sendStringResponse(502, {
      error: 'Too many filesystem checks',
      message: 'Exceeded filesystem check limit',
      code: 'TOO_MANY_FILESYSTEM_CHECKS',
      action: 'Optimize filesystem operations',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'TOO_MANY_FORKS') {
    return sendStringResponse(502, {
      error: 'Too many forks',
      message: 'Exceeded fork limit',
      code: 'TOO_MANY_FORKS',
      action: 'Optimize process creation',
      timestamp: new Date().toISOString()
    });
  }

  // ===========================================
  // DEFAULT ERROR HANDLER
  // ===========================================

  // For any unhandled errors, return a generic error response
  return sendStringResponse(500, {
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
}

// Export error monitoring function
export function monitorVercelErrors() {
  return (req, res, next) => {
    // Log request details for error tracking
    req.errorContext = {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    next();
  };
}
