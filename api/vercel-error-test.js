// Vercel Error Test API Route
// Test error handling for specific Vercel error codes

// Note: Edge Runtime doesn't support all Node.js modules
// Using simplified error handling for Edge Runtime

// Simplified Vercel error codes for Edge Runtime
const VERCEL_ERROR_CODES = {
  FUNCTION_INVOCATION_FAILED: 'FUNCTION_INVOCATION_FAILED',
  FUNCTION_INVOCATION_TIMEOUT: 'FUNCTION_INVOCATION_TIMEOUT',
  FUNCTION_PAYLOAD_TOO_LARGE: 'FUNCTION_PAYLOAD_TOO_LARGE',
  FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE: 'FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE',
  FUNCTION_THROTTLED: 'FUNCTION_THROTTLED',
  NO_RESPONSE_FROM_FUNCTION: 'NO_RESPONSE_FROM_FUNCTION',
  BODY_NOT_A_STRING_FROM_FUNCTION: 'BODY_NOT_A_STRING_FROM_FUNCTION',
  INFINITE_LOOP_DETECTED: 'INFINITE_LOOP_DETECTED'
};

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
    
    // Create test error (simplified for Edge Runtime)
    const testError = {
      code: errorCode,
      message: `Test error: ${errorCode}`,
      functionName,
      test: true,
      correlationId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...context
    };
    
    // Simple error response for Edge Runtime
    const errorResponse = {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          message: `Test error simulated: ${errorCode}`,
          code: errorCode,
          correlationId: testError.correlationId,
          timestamp: testError.timestamp
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': testError.correlationId
      }
    };
    
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
    // Simple error handling for Edge Runtime
    return new Response(JSON.stringify({
      error: {
        message: 'Error test failed',
        code: 'ERROR_TEST_FAILED',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

