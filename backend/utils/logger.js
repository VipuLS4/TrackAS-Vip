// Enhanced Structured Logging System
// Comprehensive logging with contextual information, correlation IDs, and monitoring

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly'
};

/**
 * Log Categories
 */
export const LOG_CATEGORIES = {
  SYSTEM: 'system',
  API: 'api',
  DATABASE: 'database',
  AUTH: 'auth',
  BUSINESS: 'business',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  ERROR: 'error'
};

/**
 * Custom log format with correlation ID
 */
const correlationFormat = winston.format((info) => {
  if (!info.correlationId) {
    info.correlationId = uuidv4();
  }
  return info;
});

/**
 * Enhanced logger configuration
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    correlationFormat(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'trackas-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // HTTP logs
    new winston.transports.File({ 
      filename: 'logs/http.log', 
      level: 'http',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true
    }),
    // Security logs
    new winston.transports.File({ 
      filename: 'logs/security.log', 
      level: 'warn',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          // Only log security-related messages
          if (info.category === LOG_CATEGORIES.SECURITY || 
              info.level === 'warn' || 
              info.level === 'error') {
            return info;
          }
          return false;
        })()
      )
    })
  ],
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, correlationId, category, ...meta }) => {
        let logMessage = `${timestamp} [${level}]`;
        if (correlationId) logMessage += ` [${correlationId}]`;
        if (category) logMessage += ` [${category}]`;
        logMessage += `: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        return logMessage;
      })
    )
  }));
}

/**
 * Enhanced Logger Class
 */
class EnhancedLogger {
  constructor() {
    this.logger = logger;
    this.requestId = null;
    this.userId = null;
    this.sessionId = null;
  }

  /**
   * Set request context
   */
  setRequestContext(requestId, userId = null, sessionId = null) {
    this.requestId = requestId;
    this.userId = userId;
    this.sessionId = sessionId;
  }

  /**
   * Clear request context
   */
  clearRequestContext() {
    this.requestId = null;
    this.userId = null;
    this.sessionId = null;
  }

  /**
   * Create log entry with context
   */
  createLogEntry(level, message, meta = {}) {
    const logEntry = {
      level,
      message,
      ...meta,
      timestamp: new Date().toISOString()
    };

    // Add request context if available
    if (this.requestId) {
      logEntry.requestId = this.requestId;
    }
    if (this.userId) {
      logEntry.userId = this.userId;
    }
    if (this.sessionId) {
      logEntry.sessionId = this.sessionId;
    }

    return logEntry;
  }

  /**
   * Log error
   */
  error(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.ERROR, message, {
      ...meta,
      category: LOG_CATEGORIES.ERROR
    });
    this.logger.error(logEntry);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.WARN, message, {
      ...meta,
      category: LOG_CATEGORIES.SYSTEM
    });
    this.logger.warn(logEntry);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.INFO, message, {
      ...meta,
      category: LOG_CATEGORIES.SYSTEM
    });
    this.logger.info(logEntry);
  }

  /**
   * Log HTTP request
   */
  http(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.HTTP, message, {
      ...meta,
      category: LOG_CATEGORIES.API
    });
    this.logger.http(logEntry);
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.DEBUG, message, {
      ...meta,
      category: LOG_CATEGORIES.SYSTEM
    });
    this.logger.debug(logEntry);
  }

  /**
   * Log verbose
   */
  verbose(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.VERBOSE, message, {
      ...meta,
      category: LOG_CATEGORIES.SYSTEM
    });
    this.logger.verbose(logEntry);
  }

  /**
   * Log API request
   */
  logApiRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      category: LOG_CATEGORIES.API
    };

    const level = res.statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.HTTP;
    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
    
    this.http(message, meta);
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation, table, duration, error = null) {
    const meta = {
      operation,
      table,
      duration,
      category: LOG_CATEGORIES.DATABASE
    };

    if (error) {
      meta.error = error.message;
      this.error(`Database operation failed: ${operation} on ${table}`, meta);
    } else {
      this.info(`Database operation: ${operation} on ${table}`, meta);
    }
  }

  /**
   * Log authentication event
   */
  logAuthEvent(event, userId, success, meta = {}) {
    const logMeta = {
      event,
      userId,
      success,
      category: LOG_CATEGORIES.AUTH,
      ...meta
    };

    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const message = `Auth event: ${event} - ${success ? 'success' : 'failed'}`;
    
    this.logger.log(level, message, logMeta);
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, threat, meta = {}) {
    const logMeta = {
      event,
      threat,
      category: LOG_CATEGORIES.SECURITY,
      ...meta
    };

    this.warn(`Security event: ${event}`, logMeta);
  }

  /**
   * Log business event
   */
  logBusinessEvent(event, entity, action, meta = {}) {
    const logMeta = {
      event,
      entity,
      action,
      category: LOG_CATEGORIES.BUSINESS,
      ...meta
    };

    this.info(`Business event: ${event}`, logMeta);
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, threshold = null, meta = {}) {
    const logMeta = {
      metric,
      value,
      threshold,
      category: LOG_CATEGORIES.PERFORMANCE,
      ...meta
    };

    const level = threshold && value > threshold ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    const message = `Performance: ${metric} = ${value}${threshold ? ` (threshold: ${threshold})` : ''}`;
    
    this.logger.log(level, message, logMeta);
  }

  /**
   * Log error with full context
   */
  logError(error, context = {}) {
    const logMeta = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context,
      category: LOG_CATEGORIES.ERROR
    };

    this.error(`Error occurred: ${error.message}`, logMeta);
  }

  /**
   * Create child logger with additional context
   */
  child(additionalMeta = {}) {
    const childLogger = new EnhancedLogger();
    childLogger.requestId = this.requestId;
    childLogger.userId = this.userId;
    childLogger.sessionId = this.sessionId;
    
    // Override createLogEntry to include additional meta
    const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
    childLogger.createLogEntry = (level, message, meta = {}) => {
      return originalCreateLogEntry(level, message, { ...additionalMeta, ...meta });
    };
    
    return childLogger;
  }
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger();

// Export both the original winston logger and enhanced logger
export { logger, enhancedLogger, LOG_LEVELS, LOG_CATEGORIES };
export default enhancedLogger;
