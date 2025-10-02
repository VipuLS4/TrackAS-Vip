// Vercel-Specific API Routes
// Health checks, monitoring, and error handling for Vercel deployments

import express from 'express';
import { vercelErrorHandler } from '../utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../utils/vercelErrorTypes.js';
import { enhancedLogger } from '../utils/logger.js';
import circuitBreakerManager from '../utils/circuitBreaker.js';

const router = express.Router();

/**
 * Vercel Health Check
 * Comprehensive health check for Vercel deployments
 */
router.get('/health/vercel', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check Vercel environment
    const vercelEnv = process.env.VERCEL_ENV || 'development';
    const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
    const region = process.env.VERCEL_REGION || 'unknown';
    
    // Check function limits
    const functionLimits = {
      maxDuration: parseInt(process.env.VERCEL_FUNCTION_MAX_DURATION) || 30,
      maxMemory: parseInt(process.env.VERCEL_FUNCTION_MAX_MEMORY) || 1024,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      maxResponseSize: 6 * 1024 * 1024  // 6MB
    };
    
    // Check current resource usage
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Check circuit breaker status
    const circuitBreakerStats = circuitBreakerManager.getStatistics();
    
    // Calculate health score
    const healthScore = calculateHealthScore({
      vercelEnv,
      deploymentId,
      memoryUsage,
      uptime,
      circuitBreakerStats
    });
    
    const duration = Date.now() - startTime;
    
    const healthStatus = {
      status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      duration,
      healthScore,
      vercel: {
        environment: vercelEnv,
        deploymentId,
        region,
        functionLimits
      },
      resources: {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        uptime
      },
      circuitBreakers: circuitBreakerStats,
      performance: {
        responseTime: duration,
        memoryUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      }
    };
    
    const statusCode = healthScore > 80 ? 200 : healthScore > 60 ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    enhancedLogger.error('Vercel health check failed:', error);
    
    const errorResponse = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/health/vercel',
      method: 'GET'
    });
    
    res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
  }
});

/**
 * Vercel Function Status
 * Check status of specific functions
 */
router.get('/vercel/functions/:functionName/status', async (req, res) => {
  try {
    const { functionName } = req.params;
    
    // Check function health
    const functionHealth = await checkFunctionHealth(functionName);
    
    const status = {
      function: functionName,
      status: functionHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics: functionHealth.metrics,
      errors: functionHealth.errors,
      lastExecuted: functionHealth.lastExecuted
    };
    
    const statusCode = functionHealth.healthy ? 200 : 503;
    res.status(statusCode).json(status);
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      functionName: req.params.functionName,
      endpoint: '/vercel/functions/status'
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Error Statistics
 * Get error statistics for Vercel-specific errors
 */
router.get('/vercel/errors/stats', async (req, res) => {
  try {
    const { category, severity, hours = 24 } = req.query;
    
    // Get error statistics
    const errorStats = await getVercelErrorStats({
      category,
      severity,
      hours: parseInt(hours)
    });
    
    res.json({
      success: true,
      data: errorStats,
      filters: {
        category,
        severity,
        hours: parseInt(hours)
      }
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/errors/stats',
      query: req.query
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Performance Metrics
 * Get performance metrics for Vercel functions
 */
router.get('/vercel/performance', async (req, res) => {
  try {
    const { functionName, hours = 24 } = req.query;
    
    // Get performance metrics
    const performanceMetrics = await getVercelPerformanceMetrics({
      functionName,
      hours: parseInt(hours)
    });
    
    res.json({
      success: true,
      data: performanceMetrics,
      filters: {
        functionName,
        hours: parseInt(hours)
      }
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/performance',
      query: req.query
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Circuit Breaker Status
 * Get circuit breaker status for external services
 */
router.get('/vercel/circuit-breakers', async (req, res) => {
  try {
    const circuitBreakerStats = circuitBreakerManager.getStatistics();
    
    res.json({
      success: true,
      data: circuitBreakerStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/circuit-breakers'
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Circuit Breaker Reset
 * Reset circuit breaker for a specific service
 */
router.post('/vercel/circuit-breakers/:service/reset', async (req, res) => {
  try {
    const { service } = req.params;
    
    // Reset circuit breaker
    circuitBreakerManager.reset(service);
    
    enhancedLogger.info('Circuit breaker reset', { service });
    
    res.json({
      success: true,
      message: `Circuit breaker for ${service} has been reset`,
      service,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      service: req.params.service,
      endpoint: '/vercel/circuit-breakers/reset'
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Error Simulation
 * Simulate Vercel errors for testing
 */
router.post('/vercel/errors/simulate', async (req, res) => {
  try {
    const { errorCode, functionName, context = {} } = req.body;
    
    if (!errorCode) {
      return res.status(400).json({
        error: 'errorCode is required',
        message: 'Please specify a Vercel error code to simulate'
      });
    }
    
    // Create simulated error
    const simulatedError = VercelErrorFactory.fromVercelCode(errorCode, {
      functionName,
      simulated: true,
      ...context
    });
    
    // Handle the simulated error
    const errorResponse = await vercelErrorHandler.handleVercelError(simulatedError, {
      functionName,
      simulated: true,
      ...context
    });
    
    enhancedLogger.info('Vercel error simulated', {
      errorCode,
      functionName,
      correlationId: simulatedError.correlationId
    });
    
    res.json({
      success: true,
      message: 'Error simulation completed',
      error: {
        code: errorCode,
        correlationId: simulatedError.correlationId,
        response: errorResponse
      }
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/errors/simulate',
      body: req.body
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Deployment Status
 * Check deployment status and health
 */
router.get('/vercel/deployment/status', async (req, res) => {
  try {
    const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
    const vercelEnv = process.env.VERCEL_ENV;
    const region = process.env.VERCEL_REGION;
    
    if (!deploymentId) {
      const error = VercelErrorFactory.createDeploymentError(
        'Deployment ID not found',
        VERCEL_ERROR_CODES.DEPLOYMENT_NOT_FOUND,
        deploymentId
      );
      
      const response = vercelErrorHandler.createErrorResponse(error, 404, {
        message: 'Deployment ID not found. This may not be a Vercel deployment.'
      });
      
      return res.status(response.statusCode).json(JSON.parse(response.body));
    }
    
    // Check deployment health
    const deploymentHealth = await checkDeploymentHealth(deploymentId);
    
    const status = {
      deploymentId,
      environment: vercelEnv,
      region,
      status: deploymentHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      health: deploymentHealth,
      limits: {
        maxDuration: parseInt(process.env.VERCEL_FUNCTION_MAX_DURATION) || 30,
        maxMemory: parseInt(process.env.VERCEL_FUNCTION_MAX_MEMORY) || 1024
      }
    };
    
    const statusCode = deploymentHealth.healthy ? 200 : 503;
    res.status(statusCode).json(status);
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/deployment/status',
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Function Warmup
 * Warm up functions to prevent cold starts
 */
router.post('/vercel/functions/warmup', async (req, res) => {
  try {
    const { functions = [] } = req.body;
    
    if (functions.length === 0) {
      return res.status(400).json({
        error: 'functions array is required',
        message: 'Please specify functions to warm up'
      });
    }
    
    // Warm up functions
    const warmupResults = await warmupFunctions(functions);
    
    res.json({
      success: true,
      message: 'Function warmup completed',
      results: warmupResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/functions/warmup',
      body: req.body
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

/**
 * Vercel Error Test
 * Test error handling for specific Vercel error codes
 */
router.post('/vercel/errors/test', async (req, res) => {
  try {
    const { errorCode, context = {} } = req.body;
    
    if (!errorCode) {
      return res.status(400).json({
        error: 'errorCode is required',
        message: 'Please specify a Vercel error code to test'
      });
    }
    
    // Create test error
    const testError = VercelErrorFactory.fromVercelCode(errorCode, {
      test: true,
      ...context
    });
    
    // Handle the test error
    const errorResponse = await vercelErrorHandler.handleVercelError(testError, {
      test: true,
      ...context
    });
    
    res.json({
      success: true,
      message: 'Error test completed',
      test: {
        errorCode,
        correlationId: testError.correlationId,
        response: errorResponse
      }
    });
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/vercel/errors/test',
      body: req.body
    });
    
    res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
});

// Helper functions

/**
 * Calculate health score based on various metrics
 */
function calculateHealthScore(metrics) {
  let score = 100;
  
  // Memory usage penalty
  const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
  if (memoryUsagePercent > 90) score -= 30;
  else if (memoryUsagePercent > 80) score -= 20;
  else if (memoryUsagePercent > 70) score -= 10;
  
  // Uptime bonus
  if (metrics.uptime > 3600) score += 5; // 1 hour
  if (metrics.uptime > 86400) score += 10; // 1 day
  
  // Circuit breaker penalty
  const openBreakers = Object.values(metrics.circuitBreakerStats.summary).filter(
    (count, index) => index === 0 && count > 0
  );
  if (openBreakers.length > 0) score -= 20;
  
  // Environment bonus
  if (metrics.vercelEnv === 'production') score += 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Check function health
 */
async function checkFunctionHealth(functionName) {
  // This would integrate with your function monitoring system
  return {
    healthy: true,
    metrics: {
      invocations: 0,
      errors: 0,
      averageDuration: 0,
      lastExecuted: new Date().toISOString()
    },
    errors: [],
    lastExecuted: new Date().toISOString()
  };
}

/**
 * Get Vercel error statistics
 */
async function getVercelErrorStats(filters) {
  // This would integrate with your error tracking system
  return {
    total: 0,
    byCategory: {},
    bySeverity: {},
    byFunction: {},
    trends: []
  };
}

/**
 * Get Vercel performance metrics
 */
async function getVercelPerformanceMetrics(filters) {
  // This would integrate with your performance monitoring system
  return {
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    throughput: 0
  };
}

/**
 * Check deployment health
 */
async function checkDeploymentHealth(deploymentId) {
  // This would integrate with Vercel API or your monitoring system
  return {
    healthy: true,
    status: 'ready',
    lastChecked: new Date().toISOString()
  };
}

/**
 * Warm up functions
 */
async function warmupFunctions(functions) {
  const results = [];
  
  for (const functionName of functions) {
    try {
      // Simulate function warmup
      await new Promise(resolve => setTimeout(resolve, 100));
      results.push({
        function: functionName,
        status: 'warmed',
        duration: 100
      });
    } catch (error) {
      results.push({
        function: functionName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
}

export default router;

