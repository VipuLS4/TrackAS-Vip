// Vercel Error Test API Route
// Test error handling for specific Vercel error codes

import { vercelErrorHandler } from '../utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../utils/vercelErrorTypes.js';

export const config = {
  runtime: 'edge',
  maxDuration: 15
};

export default async function handler(req) {
  const startTime = Date.now();
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        message: 'Only POST requests are allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST'
        }
      });
    }
    
    // Parse request body
    const body = await req.json();
    const { errorCode, functionName, context = {} } = body;
    
    if (!errorCode) {
      return new Response(JSON.stringify({
        error: 'errorCode is required',
        message: 'Please specify a Vercel error code to test'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Validate error code
    if (!Object.values(VERCEL_ERROR_CODES).includes(errorCode)) {
      return new Response(JSON.stringify({
        error: 'Invalid error code',
        message: `Unknown Vercel error code: ${errorCode}`,
        validCodes: Object.values(VERCEL_ERROR_CODES)
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Create test error
    const testError = VercelErrorFactory.fromVercelCode(errorCode, {
      functionName,
      test: true,
      ...context
    });
    
    // Handle the test error
    const errorResponse = await vercelErrorHandler.handleVercelError(testError, {
      functionName,
      test: true,
      ...context
    });
    
    const duration = Date.now() - startTime;
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Error test completed',
      test: {
        errorCode,
        functionName,
        correlationId: testError.correlationId,
        response: errorResponse,
        duration
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Duration': duration.toString(),
        'X-Correlation-ID': testError.correlationId
      }
    });
    
  } catch (error) {
    // Handle error through Vercel error handler
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/vercel-error-test',
      method: req.method,
      runtime: 'edge'
    });
    
    return new Response(vercelError.body, {
      status: vercelError.statusCode,
      headers: vercelError.headers
    });
  }
}

