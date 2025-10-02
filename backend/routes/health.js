// Health Check Routes
// Comprehensive health monitoring with dependency verification

import express from 'express';
import errorManager from '../utils/errorManager.js';
import circuitBreakerManager from '../utils/circuitBreaker.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = errorManager.getHealthStatus();
    const circuitBreakerStatus = circuitBreakerManager.getStatistics();
    
    const status = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      errors: {
        critical: healthStatus.criticalErrors,
        total: healthStatus.totalErrors
      },
      circuitBreakers: {
        total: circuitBreakerStatus.totalBreakers,
        open: circuitBreakerStatus.summary.open,
        halfOpen: circuitBreakerStatus.summary.halfOpen,
        closed: circuitBreakerStatus.summary.closed
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Detailed health check with dependencies
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = await performDependencyChecks();
    const duration = Date.now() - startTime;

    const overallStatus = checks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy';
    
    const status = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

/**
 * Readiness check
 */
router.get('/health/ready', async (req, res) => {
  try {
    const checks = await performReadinessChecks();
    const isReady = checks.every(check => check.status === 'ready');
    
    const status = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks
    };

    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(500).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * Liveness check
 */
router.get('/health/live', async (req, res) => {
  try {
    const isAlive = process.uptime() > 0;
    
    const status = {
      status: isAlive ? 'alive' : 'dead',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    const statusCode = isAlive ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Liveness check failed:', error);
    res.status(500).json({
      status: 'dead',
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed'
    });
  }
});

/**
 * Error statistics
 */
router.get('/health/errors', async (req, res) => {
  try {
    const errorStats = errorManager.getErrorStatistics();
    const circuitBreakerStats = circuitBreakerManager.getStatistics();
    
    const status = {
      timestamp: new Date().toISOString(),
      errors: errorStats,
      circuitBreakers: circuitBreakerStats
    };

    res.json(status);
  } catch (error) {
    logger.error('Error statistics check failed:', error);
    res.status(500).json({
      error: 'Failed to get error statistics'
    });
  }
});

/**
 * Perform dependency checks
 */
async function performDependencyChecks() {
  const checks = [];

  // Database check
  checks.push(await checkDatabase());

  // External API checks
  checks.push(await checkExternalAPIs());

  // File system check
  checks.push(await checkFileSystem());

  // Memory check
  checks.push(await checkMemory());

  // Disk space check
  checks.push(await checkDiskSpace());

  return checks;
}

/**
 * Perform readiness checks
 */
async function performReadinessChecks() {
  const checks = [];

  // Database readiness
  checks.push(await checkDatabaseReadiness());

  // Configuration readiness
  checks.push(await checkConfiguration());

  // Service dependencies readiness
  checks.push(await checkServiceDependencies());

  return checks;
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    // Import database connection
    const { pool } = await import('../db.js');
    
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'database',
      status: 'healthy',
      duration,
      message: 'Database connection successful'
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      name: 'database',
      status: 'unhealthy',
      duration,
      message: 'Database connection failed',
      error: error.message
    };
  }
}

/**
 * Check external APIs
 */
async function checkExternalAPIs() {
  const startTime = Date.now();
  const apis = [
    { name: 'payment_gateway', url: process.env.PAYMENT_GATEWAY_URL },
    { name: 'notification_service', url: process.env.NOTIFICATION_SERVICE_URL },
    { name: 'ai_service', url: process.env.AI_SERVICE_URL }
  ];

  const results = [];
  
  for (const api of apis) {
    if (!api.url) {
      results.push({
        name: api.name,
        status: 'skipped',
        message: 'URL not configured'
      });
      continue;
    }

    try {
      const response = await fetch(api.url, { 
        method: 'GET',
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      });
      
      results.push({
        name: api.name,
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        message: response.ok ? 'API accessible' : 'API returned error'
      });
    } catch (error) {
      results.push({
        name: api.name,
        status: 'unhealthy',
        message: 'API not accessible',
        error: error.message
      });
    }
  }

  const duration = Date.now() - startTime;
  const overallStatus = results.every(r => r.status === 'healthy' || r.status === 'skipped') ? 'healthy' : 'unhealthy';

  return {
    name: 'external_apis',
    status: overallStatus,
    duration,
    message: 'External API checks completed',
    details: results
  };
}

/**
 * Check file system
 */
async function checkFileSystem() {
  const startTime = Date.now();
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check if logs directory exists and is writable
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.access(logsDir, fs.constants.W_OK);
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'filesystem',
      status: 'healthy',
      duration,
      message: 'File system accessible'
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      name: 'filesystem',
      status: 'unhealthy',
      duration,
      message: 'File system not accessible',
      error: error.message
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory() {
  const startTime = Date.now();
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const usagePercent = (usedMem / totalMem) * 100;
  
  const duration = Date.now() - startTime;
  const isHealthy = usagePercent < 90; // Consider unhealthy if using more than 90% of heap
  
  return {
    name: 'memory',
    status: isHealthy ? 'healthy' : 'unhealthy',
    duration,
    message: `Memory usage: ${usagePercent.toFixed(2)}%`,
    details: {
      heapTotal: totalMem,
      heapUsed: usedMem,
      usagePercent: usagePercent.toFixed(2)
    }
  };
}

/**
 * Check disk space
 */
async function checkDiskSpace() {
  const startTime = Date.now();
  
  try {
    const fs = await import('fs/promises');
    const stats = await fs.statfs(process.cwd());
    
    const totalSpace = stats.bavail * stats.bsize;
    const freeSpace = stats.bavail * stats.bsize;
    const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;
    
    const duration = Date.now() - startTime;
    const isHealthy = usagePercent < 90; // Consider unhealthy if using more than 90% of disk
    
    return {
      name: 'disk_space',
      status: isHealthy ? 'healthy' : 'unhealthy',
      duration,
      message: `Disk usage: ${usagePercent.toFixed(2)}%`,
      details: {
        totalSpace,
        freeSpace,
        usagePercent: usagePercent.toFixed(2)
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      name: 'disk_space',
      status: 'unhealthy',
      duration,
      message: 'Disk space check failed',
      error: error.message
    };
  }
}

/**
 * Check database readiness
 */
async function checkDatabaseReadiness() {
  try {
    const { pool } = await import('../db.js');
    const client = await pool.connect();
    
    // Check if required tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'shipments', 'companies', 'operators')
    `);
    
    client.release();
    
    const requiredTables = ['users', 'shipments', 'companies', 'operators'];
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      return {
        name: 'database_readiness',
        status: 'not_ready',
        message: `Missing required tables: ${missingTables.join(', ')}`
      };
    }
    
    return {
      name: 'database_readiness',
      status: 'ready',
      message: 'Database schema is ready'
    };
  } catch (error) {
    return {
      name: 'database_readiness',
      status: 'not_ready',
      message: 'Database readiness check failed',
      error: error.message
    };
  }
}

/**
 * Check configuration
 */
async function checkConfiguration() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return {
      name: 'configuration',
      status: 'not_ready',
      message: `Missing required environment variables: ${missingVars.join(', ')}`
    };
  }
  
  return {
    name: 'configuration',
    status: 'ready',
    message: 'Configuration is complete'
  };
}

/**
 * Check service dependencies
 */
async function checkServiceDependencies() {
  // Check if all required services are configured
  const services = [
    { name: 'payment_gateway', url: process.env.PAYMENT_GATEWAY_URL },
    { name: 'notification_service', url: process.env.NOTIFICATION_SERVICE_URL }
  ];
  
  const configuredServices = services.filter(service => service.url);
  
  if (configuredServices.length < services.length) {
    return {
      name: 'service_dependencies',
      status: 'not_ready',
      message: 'Not all required services are configured'
    };
  }
  
  return {
    name: 'service_dependencies',
    status: 'ready',
    message: 'All required services are configured'
  };
}

export default router;
