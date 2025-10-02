// Vercel Health Check API Route
// Optimized for Vercel Edge Runtime

import { vercelErrorHandler } from '../utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../utils/vercelErrorTypes.js';

export const config = {
  runtime: 'edge',
  maxDuration: 10
};

export default async function handler(req) {
  const startTime = Date.now();
  
  try {
    // Check Vercel environment
    const vercelEnv = process.env.VERCEL_ENV || 'development';
    const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
    const region = process.env.VERCEL_REGION || 'unknown';
    
    // Check function limits
    const functionLimits = {
      maxDuration: 30,
      maxMemory: 1024,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      maxResponseSize: 6 * 1024 * 1024  // 6MB
    };
    
    // Check current resource usage
    const memoryUsage = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0, heapTotal: 0 };
    const uptime = process.uptime ? process.uptime() : 0;
    
    // Calculate health score
    const healthScore = calculateHealthScore({
      vercelEnv,
      deploymentId,
      memoryUsage,
      uptime
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
          total: memoryUsage.heapTotal
        },
        uptime
      },
      performance: {
        responseTime: duration,
        memoryUsagePercent: memoryUsage.heapTotal > 0 ? (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100 : 0
      }
    };
    
    const statusCode = healthScore > 80 ? 200 : healthScore > 60 ? 200 : 503;
    
    return new Response(JSON.stringify(healthStatus), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Score': healthScore.toString(),
        'X-Response-Time': duration.toString()
      }
    });
    
  } catch (error) {
    // Handle error through Vercel error handler
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/vercel-health',
      method: 'GET',
      runtime: 'edge'
    });
    
    return new Response(vercelError.body, {
      status: vercelError.statusCode,
      headers: vercelError.headers
    });
  }
}

/**
 * Calculate health score based on various metrics
 */
function calculateHealthScore(metrics) {
  let score = 100;
  
  // Memory usage penalty
  if (metrics.memoryUsage.heapTotal > 0) {
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) score -= 30;
    else if (memoryUsagePercent > 80) score -= 20;
    else if (memoryUsagePercent > 70) score -= 10;
  }
  
  // Uptime bonus
  if (metrics.uptime > 3600) score += 5; // 1 hour
  if (metrics.uptime > 86400) score += 10; // 1 day
  
  // Environment bonus
  if (metrics.vercelEnv === 'production') score += 5;
  
  return Math.max(0, Math.min(100, score));
}

