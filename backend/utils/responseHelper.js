// Vercel-compatible response helper utilities
import logger from './logger.js';

/**
 * Ensures all responses are properly formatted as strings for Vercel
 * Prevents BODY_NOT_A_STRING_FROM_FUNCTION errors
 */

export function sendJsonResponse(res, statusCode, data) {
  try {
    // Ensure data is serializable
    const serializedData = JSON.stringify(data);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(serializedData));
    
    // Send as string
    res.status(statusCode).send(serializedData);
  } catch (error) {
    logger.error('Response serialization error:', error);
    
    // Fallback response
    const fallbackData = {
      error: 'Response serialization failed',
      message: 'Unable to process response data'
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify(fallbackData));
  }
}

export function sendErrorResponse(res, statusCode, error, message = null) {
  try {
    const errorData = {
      error: error || 'Unknown error',
      message: message || 'An error occurred',
      timestamp: new Date().toISOString(),
      status: statusCode
    };
    
    sendJsonResponse(res, statusCode, errorData);
  } catch (err) {
    logger.error('Error response failed:', err);
    
    // Ultimate fallback
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send('Internal server error');
  }
}

export function sendSuccessResponse(res, data, message = 'Success') {
  try {
    const successData = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, 200, successData);
  } catch (error) {
    logger.error('Success response failed:', error);
    sendErrorResponse(res, 500, 'Response failed', 'Unable to send success response');
  }
}

export function sendValidationError(res, errors) {
  try {
    const validationData = {
      error: 'Validation failed',
      message: 'Request validation failed',
      details: errors,
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, 400, validationData);
  } catch (error) {
    logger.error('Validation error response failed:', error);
    sendErrorResponse(res, 500, 'Response failed', 'Unable to send validation error');
  }
}

export function sendNotFoundResponse(res, resource = 'Resource') {
  try {
    const notFoundData = {
      error: 'Not found',
      message: `${resource} not found`,
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, 404, notFoundData);
  } catch (error) {
    logger.error('Not found response failed:', error);
    sendErrorResponse(res, 500, 'Response failed', 'Unable to send not found response');
  }
}

export function sendUnauthorizedResponse(res, message = 'Unauthorized') {
  try {
    const unauthorizedData = {
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, 401, unauthorizedData);
  } catch (error) {
    logger.error('Unauthorized response failed:', error);
    sendErrorResponse(res, 500, 'Response failed', 'Unable to send unauthorized response');
  }
}

export function sendForbiddenResponse(res, message = 'Forbidden') {
  try {
    const forbiddenData = {
      error: 'Forbidden',
      message,
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, 403, forbiddenData);
  } catch (error) {
    logger.error('Forbidden response failed:', error);
    sendErrorResponse(res, 500, 'Response failed', 'Unable to send forbidden response');
  }
}

export function sendTooManyRequestsResponse(res, message = 'Too many requests') {
  try {
    const tooManyRequestsData = {
      error: 'Too many requests',
      message,
      timestamp: new Date().toISOString()
    };
    
    sendJsonResponse(res, 429, tooManyRequestsData);
  } catch (error) {
    logger.error('Too many requests response failed:', error);
    sendErrorResponse(res, 500, 'Response failed', 'Unable to send too many requests response');
  }
}

export function sendInternalErrorResponse(res, error, message = 'Internal server error') {
  try {
    const internalErrorData = {
      error: 'Internal server error',
      message,
      timestamp: new Date().toISOString()
    };
    
    // Log the actual error for debugging
    logger.error('Internal server error:', error);
    
    sendJsonResponse(res, 500, internalErrorData);
  } catch (err) {
    logger.error('Internal error response failed:', err);
    
    // Ultimate fallback
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send('Internal server error');
  }
}

// Middleware to ensure all responses are strings
export function ensureStringResponse(req, res, next) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send to ensure string
  res.send = function(data) {
    if (typeof data !== 'string') {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      } else {
        data = String(data);
      }
    }
    
    // Set content type if not already set
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json');
    }
    
    return originalSend.call(this, data);
  };
  
  // Override res.json to ensure string
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    return originalSend.call(this, JSON.stringify(data));
  };
  
  next();
}

// Utility to safely stringify any data
export function safeStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    logger.error('Safe stringify failed:', error);
    return JSON.stringify({
      error: 'Data serialization failed',
      message: 'Unable to serialize response data'
    });
  }
}

// Utility to validate response data
export function validateResponseData(data) {
  try {
    // Test if data can be stringified
    JSON.stringify(data);
    return true;
  } catch (error) {
    logger.error('Response data validation failed:', error);
    return false;
  }
}
