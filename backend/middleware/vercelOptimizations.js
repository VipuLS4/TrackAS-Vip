// Vercel-Specific Optimizations and Middleware
// Performance optimizations and error prevention for Vercel deployments

import { vercelErrorHandler } from '../utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../utils/vercelErrorTypes.js';
import { enhancedLogger } from '../utils/logger.js';

/**
 * Vercel Function Configuration
 */
export const vercelConfig = {
  // Prevent FUNCTION_INVOCATION_TIMEOUT
  maxDuration: 30,
  
  // Prevent FUNCTION_PAYLOAD_TOO_LARGE
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  
  // Prevent FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE
  maxResponseSize: 6 * 1024 * 1024, // 6MB
  
  // Function timeout buffer
  timeoutBuffer: 5000, // 5 seconds before actual timeout
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Circuit breaker configuration
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000
};

/**
 * Vercel Function Wrapper
 * Wraps functions to prevent common Vercel errors
 */
export function withVercelErrorHandling(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    let timeoutId;
    
    try {
      // Set up timeout guard
      timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          const error = VercelErrorFactory.createFunctionError(
            'Function timeout',
            VERCEL_ERROR_CODES.FUNCTION_INVOCATION_TIMEOUT,
            handler.name
          );
          
          const response = vercelErrorHandler.createErrorResponse(error, 504, {
            message: 'Request timeout. Please try again.',
            retryAfter: 60
          });
          
          res.status(response.statusCode).json(JSON.parse(response.body));
        }
      }, (vercelConfig.maxDuration - vercelConfig.timeoutBuffer) * 1000);

      // Check request size
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (contentLength > vercelConfig.maxRequestSize) {
        const error = VercelErrorFactory.createFunctionError(
          'Request payload too large',
          VERCEL_ERROR_CODES.FUNCTION_PAYLOAD_TOO_LARGE,
          handler.name
        );
        
        const response = vercelErrorHandler.createErrorResponse(error, 413, {
          message: 'Request is too large. Please reduce the size and try again.',
          maxSize: `${vercelConfig.maxRequestSize / (1024 * 1024)}MB`
        });
        
        return res.status(response.statusCode).json(JSON.parse(response.body));
      }

      // Execute handler
      const result = await handler(req, res);
      
      // Check response size
      if (result && typeof result === 'object') {
        const responseSize = JSON.stringify(result).length;
        if (responseSize > vercelConfig.maxResponseSize) {
          const error = VercelErrorFactory.createFunctionError(
            'Response payload too large',
            VERCEL_ERROR_CODES.FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE,
            handler.name
          );
          
          const response = vercelErrorHandler.createErrorResponse(error, 500, {
            message: 'Response is too large. Please contact support.',
            maxSize: `${vercelConfig.maxResponseSize / (1024 * 1024)}MB`
          });
          
          return res.status(response.statusCode).json(JSON.parse(response.body));
        }
      }

      // Clear timeout
      clearTimeout(timeoutId);
      
      // Log performance metrics
      const duration = Date.now() - startTime;
      enhancedLogger.info('Function executed successfully', {
        function: handler.name,
        duration,
        requestSize: contentLength,
        responseSize: result ? JSON.stringify(result).length : 0
      });

      return result;
      
    } catch (error) {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle error through Vercel error handler
      const vercelError = await vercelErrorHandler.handleVercelError(error, {
        functionName: handler.name,
        duration: Date.now() - startTime,
        requestSize: parseInt(req.headers['content-length'] || '0')
      });

      // Send error response
      if (!res.headersSent) {
        res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
      }
    }
  };
}

/**
 * Vercel Edge Function Wrapper
 * Optimized for Edge Runtime
 */
export function withVercelEdgeErrorHandling(handler) {
  return async (req) => {
    const startTime = Date.now();
    
    try {
      // Edge function specific optimizations
      const result = await handler(req);
      
      // Ensure response is properly formatted
      if (result && typeof result === 'object') {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // 5 minutes cache
          }
        });
      }
      
      return result;
      
    } catch (error) {
      // Handle Edge function error
      const vercelError = await vercelErrorHandler.handleVercelError(error, {
        functionName: handler.name,
        runtime: 'edge',
        duration: Date.now() - startTime
      });

      return new Response(vercelError.body, {
        status: vercelError.statusCode,
        headers: vercelError.headers
      });
    }
  };
}

/**
 * Vercel Middleware Error Boundary
 * Prevents MIDDLEWARE_INVOCATION_FAILED errors
 */
export function withVercelMiddlewareErrorBoundary(middleware) {
  return async (request, event) => {
    const startTime = Date.now();
    
    try {
      // Execute middleware
      const result = await middleware(request, event);
      
      // Log middleware performance
      const duration = Date.now() - startTime;
      enhancedLogger.info('Middleware executed successfully', {
        middleware: middleware.name,
        duration,
        path: request.nextUrl.pathname
      });
      
      return result;
      
    } catch (error) {
      // Handle middleware error
      const vercelError = await vercelErrorHandler.handleVercelError(error, {
        middlewareName: middleware.name,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent'),
        duration: Date.now() - startTime
      });

      // Return safe fallback response
      return new Response(vercelError.body, {
        status: vercelError.statusCode,
        headers: {
          ...vercelError.headers,
          'Retry-After': '60'
        }
      });
    }
  };
}

/**
 * Vercel Request Size Limiter
 * Prevents FUNCTION_PAYLOAD_TOO_LARGE errors
 */
export function vercelRequestSizeLimiter(maxSize = vercelConfig.maxRequestSize) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      const error = VercelErrorFactory.createFunctionError(
        `Request payload exceeds ${maxSize / (1024 * 1024)}MB limit`,
        VERCEL_ERROR_CODES.FUNCTION_PAYLOAD_TOO_LARGE,
        'requestSizeLimiter'
      );
      
      const response = vercelErrorHandler.createErrorResponse(error, 413, {
        message: `Request is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
        maxSize: `${maxSize / (1024 * 1024)}MB`,
        actualSize: `${(contentLength / (1024 * 1024)).toFixed(2)}MB`
      });
      
      return res.status(response.statusCode).json(JSON.parse(response.body));
    }
    
    next();
  };
}

/**
 * Vercel Response Size Limiter
 * Prevents FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE errors
 */
export function vercelResponseSizeLimiter(maxSize = vercelConfig.maxResponseSize) {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      if (data && data.length > maxSize) {
        const error = VercelErrorFactory.createFunctionError(
          `Response payload exceeds ${maxSize / (1024 * 1024)}MB limit`,
          VERCEL_ERROR_CODES.FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE,
          'responseSizeLimiter'
        );
        
        const response = vercelErrorHandler.createErrorResponse(error, 500, {
          message: 'Response is too large. Please contact support.',
          maxSize: `${maxSize / (1024 * 1024)}MB`,
          actualSize: `${(data.length / (1024 * 1024)).toFixed(2)}MB`
        });
        
        return res.status(response.statusCode).json(JSON.parse(response.body));
      }
      
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      const jsonString = JSON.stringify(data);
      if (jsonString.length > maxSize) {
        const error = VercelErrorFactory.createFunctionError(
          `Response payload exceeds ${maxSize / (1024 * 1024)}MB limit`,
          VERCEL_ERROR_CODES.FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE,
          'responseSizeLimiter'
        );
        
        const response = vercelErrorHandler.createErrorResponse(error, 500, {
          message: 'Response is too large. Please contact support.',
          maxSize: `${maxSize / (1024 * 1024)}MB`,
          actualSize: `${(jsonString.length / (1024 * 1024)).toFixed(2)}MB`
        });
        
        return res.status(response.statusCode).json(JSON.parse(response.body));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Vercel Timeout Handler
 * Prevents FUNCTION_INVOCATION_TIMEOUT errors
 */
export function vercelTimeoutHandler(timeout = vercelConfig.maxDuration) {
  return (req, res, next) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        const error = VercelErrorFactory.createFunctionError(
          'Function invocation timeout',
          VERCEL_ERROR_CODES.FUNCTION_INVOCATION_TIMEOUT,
          'timeoutHandler'
        );
        
        const response = vercelErrorHandler.createErrorResponse(error, 504, {
          message: 'Request timeout. Please try again.',
          timeout: `${timeout}s`,
          retryAfter: 60
        });
        
        res.status(response.statusCode).json(JSON.parse(response.body));
      }
    }, (timeout - vercelConfig.timeoutBuffer) * 1000);
    
    res.on('finish', () => clearTimeout(timeoutId));
    res.on('close', () => clearTimeout(timeoutId));
    next();
  };
}

/**
 * Vercel Throttling Handler
 * Prevents FUNCTION_THROTTLED errors
 */
export function vercelThrottlingHandler(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    skipSuccessfulRequests = true,
    skipFailedRequests = false
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= max) {
      const error = VercelErrorFactory.createFunctionError(
        'Function throttled',
        VERCEL_ERROR_CODES.FUNCTION_THROTTLED,
        'throttlingHandler'
      );
      
      const response = vercelErrorHandler.createErrorResponse(error, 503, {
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
        limit: max,
        remaining: 0
      });
      
      return res.status(response.statusCode).json(JSON.parse(response.body));
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': Math.max(0, max - userRequests.length).toString(),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });
    
    next();
  };
}

/**
 * Vercel DNS Error Handler
 * Prevents DNS resolution errors
 */
export function vercelDNSErrorHandler() {
  return async (req, res, next) => {
    try {
      // Check if hostname is valid
      const hostname = req.get('host');
      if (!hostname || hostname.length === 0) {
        const error = VercelErrorFactory.createDNSError(
          'DNS hostname empty',
          VERCEL_ERROR_CODES.DNS_HOSTNAME_EMPTY,
          hostname
        );
        
        const response = vercelErrorHandler.createErrorResponse(error, 502, {
          message: 'Invalid hostname. Please check the URL.'
        });
        
        return res.status(response.statusCode).json(JSON.parse(response.body));
      }
      
      // Check for private IP resolution
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        const error = VercelErrorFactory.createDNSError(
          'DNS hostname resolved to private IP',
          VERCEL_ERROR_CODES.DNS_HOSTNAME_RESOLVED_PRIVATE,
          hostname
        );
        
        const response = vercelErrorHandler.createErrorResponse(error, 404, {
          message: 'Invalid hostname. Please use a public URL.'
        });
        
        return res.status(response.statusCode).json(JSON.parse(response.body));
      }
      
      next();
    } catch (error) {
      const vercelError = await vercelErrorHandler.handleVercelError(error, {
        hostname: req.get('host'),
        path: req.path
      });
      
      res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
    }
  };
}

/**
 * Vercel Image Optimization Handler
 * Prevents image optimization errors
 */
export function vercelImageOptimizationHandler() {
  return async (req, res, next) => {
    try {
      // Check if request is for image optimization
      if (req.path.includes('/_next/image') || req.path.includes('/api/image')) {
        const imageUrl = req.query.url || req.query.src;
        
        if (!imageUrl) {
          const error = VercelErrorFactory.createImageOptimizationError(
            'Invalid image optimization request',
            VERCEL_ERROR_CODES.INVALID_IMAGE_OPTIMIZE_REQUEST,
            imageUrl
          );
          
          const response = vercelErrorHandler.createErrorResponse(error, 400, {
            message: 'Image URL is required for optimization.'
          });
          
          return res.status(response.statusCode).json(JSON.parse(response.body));
        }
        
        // Validate image URL
        try {
          new URL(imageUrl);
        } catch (urlError) {
          const error = VercelErrorFactory.createImageOptimizationError(
            'Invalid image URL',
            VERCEL_ERROR_CODES.INVALID_IMAGE_OPTIMIZE_REQUEST,
            imageUrl
          );
          
          const response = vercelErrorHandler.createErrorResponse(error, 400, {
            message: 'Invalid image URL format.'
          });
          
          return res.status(response.statusCode).json(JSON.parse(response.body));
        }
      }
      
      next();
    } catch (error) {
      const vercelError = await vercelErrorHandler.handleVercelError(error, {
        path: req.path,
        query: req.query
      });
      
      res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
    }
  };
}

/**
 * Vercel Deployment Status Checker
 * Prevents deployment-related errors
 */
export function vercelDeploymentStatusChecker() {
  return async (req, res, next) => {
    try {
      // Check deployment status
      const deploymentStatus = process.env.VERCEL_ENV || 'development';
      
      if (deploymentStatus === 'production') {
        // Additional production checks
        const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
        if (!deploymentId) {
          const error = VercelErrorFactory.createDeploymentError(
            'Deployment not found',
            VERCEL_ERROR_CODES.DEPLOYMENT_NOT_FOUND,
            deploymentId
          );
          
          const response = vercelErrorHandler.createErrorResponse(error, 404, {
            message: 'Deployment not found. Please contact support.'
          });
          
          return res.status(response.statusCode).json(JSON.parse(response.body));
        }
      }
      
      next();
    } catch (error) {
      const vercelError = await vercelErrorHandler.handleVercelError(error, {
        deploymentStatus: process.env.VERCEL_ENV,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID
      });
      
      res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
    }
  };
}

/**
 * Vercel Performance Monitor
 * Tracks performance metrics to prevent timeouts
 */
export function vercelPerformanceMonitor() {
  return (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      // Log performance metrics
      enhancedLogger.info('Request performance metrics', {
        method: req.method,
        path: req.path,
        duration,
        memoryDelta,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      });
      
      // Alert on slow requests
      if (duration > 10000) { // 10 seconds
        enhancedLogger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration,
          memoryDelta
        });
      }
      
      // Alert on high memory usage
      if (memoryDelta > 50 * 1024 * 1024) { // 50MB
        enhancedLogger.warn('High memory usage detected', {
          method: req.method,
          path: req.path,
          memoryDelta: `${(memoryDelta / (1024 * 1024)).toFixed(2)}MB`
        });
      }
    });
    
    next();
  };
}

export default {
  vercelConfig,
  withVercelErrorHandling,
  withVercelEdgeErrorHandling,
  withVercelMiddlewareErrorBoundary,
  vercelRequestSizeLimiter,
  vercelResponseSizeLimiter,
  vercelTimeoutHandler,
  vercelThrottlingHandler,
  vercelDNSErrorHandler,
  vercelImageOptimizationHandler,
  vercelDeploymentStatusChecker,
  vercelPerformanceMonitor
};

