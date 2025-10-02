// Vercel-specific error handling middleware with string response guarantee
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

  // Helper function to send string responses
  function sendStringResponse(statusCode, data) {
    try {
      const responseString = JSON.stringify(data);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(responseString));
      res.status(statusCode).send(responseString);
    } catch (stringifyError) {
      logger.error('String response failed:', stringifyError);
      // Ultimate fallback
      res.setHeader('Content-Type', 'text/plain');
      res.status(500).send('Internal server error');
    }
  }

  // Handle specific Vercel errors
  if (err.code === 'FUNCTION_INVOCATION_FAILED') {
    return sendStringResponse(500, {
      error: 'Function invocation failed',
      message: 'The server function encountered an error',
      code: 'FUNCTION_INVOCATION_FAILED'
    });
  }

  if (err.code === 'FUNCTION_INVOCATION_TIMEOUT') {
    return sendStringResponse(504, {
      error: 'Function timeout',
      message: 'The request took too long to process',
      code: 'FUNCTION_INVOCATION_TIMEOUT'
    });
  }

  if (err.code === 'FUNCTION_PAYLOAD_TOO_LARGE') {
    return sendStringResponse(413, {
      error: 'Payload too large',
      message: 'Request body exceeds size limit',
      code: 'FUNCTION_PAYLOAD_TOO_LARGE'
    });
  }

  if (err.code === 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE') {
    return sendStringResponse(500, {
      error: 'Response too large',
      message: 'Response exceeds size limit',
      code: 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE'
    });
  }

  if (err.code === 'FUNCTION_THROTTLED') {
    return sendStringResponse(503, {
      error: 'Function throttled',
      message: 'Too many requests, please try again later',
      code: 'FUNCTION_THROTTLED'
    });
  }

  if (err.code === 'NO_RESPONSE_FROM_FUNCTION') {
    return sendStringResponse(502, {
      error: 'No response from function',
      message: 'The server function did not respond',
      code: 'NO_RESPONSE_FROM_FUNCTION'
    });
  }

  if (err.code === 'BODY_NOT_A_STRING_FROM_FUNCTION') {
    return sendStringResponse(502, {
      error: 'Invalid response format',
      message: 'Server returned invalid response format',
      code: 'BODY_NOT_A_STRING_FROM_FUNCTION'
    });
  }

  // Handle routing errors
  if (err.code === 'ROUTER_CANNOT_MATCH') {
    return sendStringResponse(502, {
      error: 'Routing error',
      message: 'Unable to match request to handler',
      code: 'ROUTER_CANNOT_MATCH'
    });
  }

  if (err.code === 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR') {
    return sendStringResponse(502, {
      error: 'External connection failed',
      message: 'Unable to connect to external service',
      code: 'ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR'
    });
  }

  // Handle request errors
  if (err.code === 'INVALID_REQUEST_METHOD') {
    return sendStringResponse(405, {
      error: 'Invalid request method',
      message: 'Method not allowed',
      code: 'INVALID_REQUEST_METHOD'
    });
  }

  if (err.code === 'MALFORMED_REQUEST_HEADER') {
    return sendStringResponse(400, {
      error: 'Malformed request header',
      message: 'Invalid request headers',
      code: 'MALFORMED_REQUEST_HEADER'
    });
  }

  if (err.code === 'REQUEST_HEADER_TOO_LARGE') {
    return sendStringResponse(431, {
      error: 'Request header too large',
      message: 'Request headers exceed size limit',
      code: 'REQUEST_HEADER_TOO_LARGE'
    });
  }

  if (err.code === 'URL_TOO_LONG') {
    return sendStringResponse(414, {
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
    return sendStringResponse(416, {
      error: 'Range request error',
      message: 'Invalid range request',
      code: err.code
    });
  }

  // Handle resource errors
  if (err.code === 'RESOURCE_NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Resource not found',
      message: 'The requested resource was not found',
      code: 'RESOURCE_NOT_FOUND'
    });
  }

  // Handle infinite loop detection
  if (err.code === 'INFINITE_LOOP_DETECTED') {
    return sendStringResponse(508, {
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
    return sendStringResponse(400, {
      error: 'Image optimization error',
      message: 'Failed to optimize image',
      code: err.code
    });
  }

  // Handle middleware errors
  if (err.code === 'MIDDLEWARE_INVOCATION_FAILED') {
    return sendStringResponse(500, {
      error: 'Middleware error',
      message: 'Middleware function failed',
      code: 'MIDDLEWARE_INVOCATION_FAILED'
    });
  }

  if (err.code === 'MIDDLEWARE_INVOCATION_TIMEOUT') {
    return sendStringResponse(504, {
      error: 'Middleware timeout',
      message: 'Middleware function timed out',
      code: 'MIDDLEWARE_INVOCATION_TIMEOUT'
    });
  }

  if (err.code === 'MIDDLEWARE_RUNTIME_DEPRECATED') {
    return sendStringResponse(503, {
      error: 'Middleware runtime deprecated',
      message: 'Middleware runtime is no longer supported',
      code: 'MIDDLEWARE_RUNTIME_DEPRECATED'
    });
  }

  // Handle sandbox errors
  if (err.code === 'SANDBOX_NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Sandbox not found',
      message: 'Development sandbox not available',
      code: 'SANDBOX_NOT_FOUND'
    });
  }

  if (err.code === 'SANDBOX_NOT_LISTENING') {
    return sendStringResponse(502, {
      error: 'Sandbox not listening',
      message: 'Development sandbox is not responding',
      code: 'SANDBOX_NOT_LISTENING'
    });
  }

  if (err.code === 'SANDBOX_STOPPED') {
    return sendStringResponse(410, {
      error: 'Sandbox stopped',
      message: 'Development sandbox has been stopped',
      code: 'SANDBOX_STOPPED'
    });
  }

  // Handle deployment errors
  if (err.code === 'DEPLOYMENT_BLOCKED') {
    return sendStringResponse(403, {
      error: 'Deployment blocked',
      message: 'Deployment is blocked due to configuration issues',
      code: 'DEPLOYMENT_BLOCKED'
    });
  }

  if (err.code === 'DEPLOYMENT_DELETED') {
    return sendStringResponse(410, {
      error: 'Deployment deleted',
      message: 'Deployment has been deleted',
      code: 'DEPLOYMENT_DELETED'
    });
  }

  if (err.code === 'DEPLOYMENT_DISABLED') {
    return sendStringResponse(402, {
      error: 'Deployment disabled',
      message: 'Deployment is disabled',
      code: 'DEPLOYMENT_DISABLED'
    });
  }

  if (err.code === 'DEPLOYMENT_NOT_FOUND') {
    return sendStringResponse(404, {
      error: 'Deployment not found',
      message: 'Deployment not found',
      code: 'DEPLOYMENT_NOT_FOUND'
    });
  }

  if (err.code === 'DEPLOYMENT_NOT_READY_REDIRECTING') {
    return sendStringResponse(303, {
      error: 'Deployment not ready',
      message: 'Deployment is not ready, redirecting',
      code: 'DEPLOYMENT_NOT_READY_REDIRECTING'
    });
  }

  if (err.code === 'DEPLOYMENT_PAUSED') {
    return sendStringResponse(503, {
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
    return sendStringResponse(502, {
      error: 'DNS resolution error',
      message: 'Unable to resolve hostname',
      code: err.code
    });
  }

  // Handle cache errors
  if (err.code === 'FALLBACK_BODY_TOO_LARGE') {
    return sendStringResponse(502, {
      error: 'Cache body too large',
      message: 'Cached response body exceeds size limit',
      code: 'FALLBACK_BODY_TOO_LARGE'
    });
  }

  // Handle filesystem errors
  if (err.code === 'TOO_MANY_FILESYSTEM_CHECKS') {
    return sendStringResponse(502, {
      error: 'Too many filesystem checks',
      message: 'Exceeded filesystem check limit',
      code: 'TOO_MANY_FILESYSTEM_CHECKS'
    });
  }

  if (err.code === 'TOO_MANY_FORKS') {
    return sendStringResponse(502, {
      error: 'Too many forks',
      message: 'Exceeded fork limit',
      code: 'TOO_MANY_FORKS'
    });
  }

  // Handle microfrontends errors
  if (err.code === 'MICROFRONTENDS_MIDDLEWARE_ERROR') {
    return sendStringResponse(500, {
      error: 'Microfrontends middleware error',
      message: 'Microfrontends middleware failed',
      code: 'MICROFRONTENDS_MIDDLEWARE_ERROR'
    });
  }

  // Default error handler - always returns string
  return sendStringResponse(500, {
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  });
}
