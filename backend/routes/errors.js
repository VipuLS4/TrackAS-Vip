// Error reporting and monitoring routes
import express from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Error reporting endpoint
router.post('/report', [
  body('name').notEmpty().withMessage('Error name is required'),
  body('message').notEmpty().withMessage('Error message is required'),
  body('code').notEmpty().withMessage('Error code is required'),
  body('severity').isIn(['CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG']).withMessage('Invalid severity level'),
  body('category').isIn(['VALIDATION', 'AUTHENTICATION', 'AUTHORIZATION', 'NETWORK', 'API', 'RENDERING', 'BUSINESS_LOGIC', 'SYSTEM', 'SECURITY', 'PERFORMANCE']).withMessage('Invalid category'),
  body('correlationId').notEmpty().withMessage('Correlation ID is required'),
  body('timestamp').isISO8601().withMessage('Invalid timestamp format'),
  body('userAgent').optional().isString(),
  body('url').optional().isURL(),
  body('stack').optional().isString(),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const errorData = req.body;
    
    // Log error details
    logger.error('Client error reported:', {
      name: errorData.name,
      message: errorData.message,
      code: errorData.code,
      severity: errorData.severity,
      category: errorData.category,
      correlationId: errorData.correlationId,
      timestamp: errorData.timestamp,
      userAgent: errorData.userAgent,
      url: errorData.url,
      stack: errorData.stack,
      context: errorData.context
    });

    // Store error in database (optional)
    try {
      // You can implement database storage here
      // await storeErrorInDatabase(errorData);
    } catch (dbError) {
      logger.error('Failed to store error in database:', dbError);
    }

    // Send to external monitoring service (optional)
    try {
      // You can integrate with services like Sentry, LogRocket, etc.
      // await sendToMonitoringService(errorData);
    } catch (monitoringError) {
      logger.error('Failed to send to monitoring service:', monitoringError);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Error reported successfully',
      correlationId: errorData.correlationId
    });

  } catch (error) {
    logger.error('Error in error reporting endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      correlationId: req.body.correlationId || 'unknown'
    });
  }
});

// Get error statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    // This would typically require authentication
    // For now, return mock statistics
    
    const stats = {
      totalErrors: 0,
      errorsByCategory: {
        VALIDATION: 0,
        AUTHENTICATION: 0,
        AUTHORIZATION: 0,
        NETWORK: 0,
        API: 0,
        RENDERING: 0,
        BUSINESS_LOGIC: 0,
        SYSTEM: 0,
        SECURITY: 0,
        PERFORMANCE: 0
      },
      errorsBySeverity: {
        CRITICAL: 0,
        ERROR: 0,
        WARNING: 0,
        INFO: 0,
        DEBUG: 0
      },
      recentErrors: [],
      errorRate: 0,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting error statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get error statistics'
    });
  }
});

// Health check for error reporting service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Error reporting service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;