// Circuit Breaker Implementation
// Implements circuit breaker pattern for external service calls

import logger from './logger.js';
import { ErrorFactory, ERROR_CATEGORY } from './errorTypes.js';

/**
 * Circuit Breaker States
 */
export const CIRCUIT_STATE = {
  CLOSED: 'CLOSED',     // Normal operation
  OPEN: 'OPEN',         // Circuit is open, requests are blocked
  HALF_OPEN: 'HALF_OPEN' // Testing if service is back
};

/**
 * Circuit Breaker Configuration
 */
export class CircuitBreakerConfig {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;        // Number of failures before opening
    this.successThreshold = options.successThreshold || 3;        // Number of successes to close from half-open
    this.timeout = options.timeout || 60000;                      // Timeout in ms before trying half-open
    this.resetTimeout = options.resetTimeout || 30000;            // Time to wait before resetting
    this.monitoringPeriod = options.monitoringPeriod || 10000;    // Period for monitoring
    this.volumeThreshold = options.volumeThreshold || 10;         // Minimum requests before considering circuit
  }
}

/**
 * Circuit Breaker Class
 */
export class CircuitBreaker {
  constructor(name, config = new CircuitBreakerConfig()) {
    this.name = name;
    this.config = config;
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.requestCount = 0;
    this.monitoringStartTime = Date.now();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateChanges: 0,
      lastStateChange: null
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn, context = {}) {
    this.stats.totalRequests++;
    this.requestCount++;

    // Check if circuit should be opened
    if (this.state === CIRCUIT_STATE.CLOSED) {
      if (this.shouldOpenCircuit()) {
        this.openCircuit();
      }
    }

    // Check if circuit is open
    if (this.state === CIRCUIT_STATE.OPEN) {
      if (this.shouldAttemptReset()) {
        this.halfOpenCircuit();
      } else {
        throw this.createCircuitOpenError(context);
      }
    }

    // Execute the function
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error, context);
      throw error;
    }
  }

  /**
   * Check if circuit should be opened
   */
  shouldOpenCircuit() {
    const now = Date.now();
    const timeSinceMonitoringStart = now - this.monitoringStartTime;
    
    // Reset monitoring period if it's been too long
    if (timeSinceMonitoringStart > this.config.monitoringPeriod) {
      this.resetMonitoring();
      return false;
    }

    // Check if we have enough volume
    if (this.requestCount < this.config.volumeThreshold) {
      return false;
    }

    // Check failure threshold
    return this.failureCount >= this.config.failureThreshold;
  }

  /**
   * Check if circuit should attempt reset
   */
  shouldAttemptReset() {
    if (!this.nextAttemptTime) {
      return false;
    }
    
    return Date.now() >= this.nextAttemptTime;
  }

  /**
   * Open the circuit
   */
  openCircuit() {
    if (this.state !== CIRCUIT_STATE.OPEN) {
      this.state = CIRCUIT_STATE.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      this.stats.stateChanges++;
      this.stats.lastStateChange = new Date().toISOString();
      
      logger.warn(`Circuit breaker opened for ${this.name}`, {
        circuitBreaker: this.name,
        state: this.state,
        failureCount: this.failureCount,
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
      });
    }
  }

  /**
   * Half-open the circuit
   */
  halfOpenCircuit() {
    if (this.state !== CIRCUIT_STATE.HALF_OPEN) {
      this.state = CIRCUIT_STATE.HALF_OPEN;
      this.successCount = 0;
      this.stats.stateChanges++;
      this.stats.lastStateChange = new Date().toISOString();
      
      logger.info(`Circuit breaker half-opened for ${this.name}`, {
        circuitBreaker: this.name,
        state: this.state
      });
    }
  }

  /**
   * Close the circuit
   */
  closeCircuit() {
    if (this.state !== CIRCUIT_STATE.CLOSED) {
      this.state = CIRCUIT_STATE.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      this.nextAttemptTime = null;
      this.stats.stateChanges++;
      this.stats.lastStateChange = new Date().toISOString();
      
      logger.info(`Circuit breaker closed for ${this.name}`, {
        circuitBreaker: this.name,
        state: this.state
      });
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    this.stats.totalSuccesses++;
    
    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.closeCircuit();
      }
    } else if (this.state === CIRCUIT_STATE.CLOSED) {
      // Reset failure count on success
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Handle failed execution
   */
  onFailure(error, context = {}) {
    this.stats.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    logger.warn(`Circuit breaker failure for ${this.name}`, {
      circuitBreaker: this.name,
      error: error.message,
      failureCount: this.failureCount,
      context
    });

    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.openCircuit();
    }
  }

  /**
   * Create circuit open error
   */
  createCircuitOpenError(context = {}) {
    return ErrorFactory.createCircuitBreakerError(
      `Circuit breaker is open for ${this.name}`,
      this.name,
      this.state,
      {
        ...context,
        nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
        failureCount: this.failureCount
      }
    );
  }

  /**
   * Reset monitoring period
   */
  resetMonitoring() {
    this.monitoringStartTime = Date.now();
    this.requestCount = 0;
    this.failureCount = 0;
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      stats: { ...this.stats }
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.requestCount = 0;
    this.monitoringStartTime = Date.now();
    
    logger.info(`Circuit breaker reset for ${this.name}`, {
      circuitBreaker: this.name
    });
  }

  /**
   * Check if circuit allows requests
   */
  canExecute() {
    if (this.state === CIRCUIT_STATE.CLOSED) {
      return true;
    }
    
    if (this.state === CIRCUIT_STATE.OPEN) {
      return this.shouldAttemptReset();
    }
    
    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      return true;
    }
    
    return false;
  }
}

/**
 * Circuit Breaker Manager
 */
export class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
    this.defaultConfig = new CircuitBreakerConfig();
  }

  /**
   * Get or create circuit breaker
   */
  getBreaker(name, config = null) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config || this.defaultConfig));
    }
    return this.breakers.get(name);
  }

  /**
   * Execute with circuit breaker
   */
  async execute(name, fn, config = null, context = {}) {
    const breaker = this.getBreaker(name, config);
    return await breaker.execute(fn, context);
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllStatuses() {
    const statuses = {};
    for (const [name, breaker] of this.breakers) {
      statuses[name] = breaker.getStatus();
    }
    return statuses;
  }

  /**
   * Reset circuit breaker
   */
  reset(name) {
    if (this.breakers.has(name)) {
      this.breakers.get(name).reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Remove circuit breaker
   */
  remove(name) {
    this.breakers.delete(name);
  }

  /**
   * Get circuit breaker statistics
   */
  getStatistics() {
    const stats = {
      totalBreakers: this.breakers.size,
      breakers: this.getAllStatuses(),
      summary: {
        open: 0,
        halfOpen: 0,
        closed: 0
      }
    };

    for (const breaker of this.breakers.values()) {
      stats.summary[breaker.state.toLowerCase().replace('_', '')]++;
    }

    return stats;
  }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();

// Export convenience functions
export function createCircuitBreaker(name, config = null) {
  return circuitBreakerManager.getBreaker(name, config);
}

export function executeWithCircuitBreaker(name, fn, config = null, context = {}) {
  return circuitBreakerManager.execute(name, fn, config, context);
}

export function getCircuitBreakerStatus(name) {
  return circuitBreakerManager.getBreaker(name).getStatus();
}

export function resetCircuitBreaker(name) {
  circuitBreakerManager.reset(name);
}

export function getAllCircuitBreakerStatuses() {
  return circuitBreakerManager.getAllStatuses();
}

export default circuitBreakerManager;
