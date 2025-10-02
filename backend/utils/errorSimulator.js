// Error Simulation and Testing Tools
// Comprehensive error simulation for chaos engineering and testing

import { ErrorFactory, ERROR_SEVERITY, ERROR_CATEGORY } from './errorTypes.js';
import errorManager from './errorManager.js';
import circuitBreakerManager from './circuitBreaker.js';
import logger from './logger.js';

/**
 * Error Simulation Types
 */
export const SIMULATION_TYPES = {
  RANDOM: 'random',
  SEQUENTIAL: 'sequential',
  BURST: 'burst',
  CASCADE: 'cascade',
  CHAOS: 'chaos'
};

/**
 * Error Simulator Class
 */
export class ErrorSimulator {
  constructor() {
    this.isSimulating = false;
    this.simulationConfig = null;
    this.simulationInterval = null;
    this.errorCount = 0;
    this.maxErrors = 100;
  }

  /**
   * Start error simulation
   */
  startSimulation(config) {
    if (this.isSimulating) {
      throw new Error('Simulation already running');
    }

    this.simulationConfig = {
      type: config.type || SIMULATION_TYPES.RANDOM,
      duration: config.duration || 60000, // 1 minute
      interval: config.interval || 1000, // 1 second
      errorTypes: config.errorTypes || Object.values(ERROR_CATEGORY),
      severity: config.severity || Object.values(ERROR_SEVERITY),
      probability: config.probability || 0.1, // 10% chance
      maxErrors: config.maxErrors || 100,
      ...config
    };

    this.isSimulating = true;
    this.errorCount = 0;
    this.maxErrors = this.simulationConfig.maxErrors;

    logger.info('Error simulation started', {
      type: this.simulationConfig.type,
      duration: this.simulationConfig.duration,
      interval: this.simulationConfig.interval
    });

    this.simulationInterval = setInterval(() => {
      this.generateError();
    }, this.simulationConfig.interval);

    // Stop simulation after duration
    setTimeout(() => {
      this.stopSimulation();
    }, this.simulationConfig.duration);

    return this.simulationConfig;
  }

  /**
   * Stop error simulation
   */
  stopSimulation() {
    if (!this.isSimulating) {
      return;
    }

    this.isSimulating = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    logger.info('Error simulation stopped', {
      errorsGenerated: this.errorCount
    });

    return {
      errorsGenerated: this.errorCount,
      duration: this.simulationConfig.duration
    };
  }

  /**
   * Generate error based on simulation type
   */
  generateError() {
    if (this.errorCount >= this.maxErrors) {
      this.stopSimulation();
      return;
    }

    const shouldGenerate = Math.random() < this.simulationConfig.probability;
    if (!shouldGenerate) {
      return;
    }

    let error;
    
    switch (this.simulationConfig.type) {
      case SIMULATION_TYPES.RANDOM:
        error = this.generateRandomError();
        break;
      case SIMULATION_TYPES.SEQUENTIAL:
        error = this.generateSequentialError();
        break;
      case SIMULATION_TYPES.BURST:
        error = this.generateBurstError();
        break;
      case SIMULATION_TYPES.CASCADE:
        error = this.generateCascadeError();
        break;
      case SIMULATION_TYPES.CHAOS:
        error = this.generateChaosError();
        break;
      default:
        error = this.generateRandomError();
    }

    if (error) {
      this.simulateError(error);
      this.errorCount++;
    }
  }

  /**
   * Generate random error
   */
  generateRandomError() {
    const category = this.getRandomElement(this.simulationConfig.errorTypes);
    const severity = this.getRandomElement(this.simulationConfig.severity);
    
    return this.createErrorByCategory(category, severity);
  }

  /**
   * Generate sequential error
   */
  generateSequentialError() {
    const categories = this.simulationConfig.errorTypes;
    const index = this.errorCount % categories.length;
    const category = categories[index];
    const severity = this.getRandomElement(this.simulationConfig.severity);
    
    return this.createErrorByCategory(category, severity);
  }

  /**
   * Generate burst error
   */
  generateBurstError() {
    // Generate multiple errors in quick succession
    const burstSize = Math.floor(Math.random() * 5) + 1;
    const errors = [];
    
    for (let i = 0; i < burstSize && this.errorCount < this.maxErrors; i++) {
      const error = this.generateRandomError();
      if (error) {
        errors.push(error);
        this.errorCount++;
      }
    }
    
    return errors[0]; // Return first error, others will be handled separately
  }

  /**
   * Generate cascade error
   */
  generateCascadeError() {
    // Start with one error, then generate related errors
    const primaryError = this.generateRandomError();
    if (!primaryError) return null;

    // Generate 2-4 related errors
    const cascadeSize = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < cascadeSize && this.errorCount < this.maxErrors; i++) {
      const relatedError = this.createErrorByCategory(
        primaryError.category,
        this.getRandomElement(this.simulationConfig.severity)
      );
      
      if (relatedError) {
        this.simulateError(relatedError);
        this.errorCount++;
      }
    }

    return primaryError;
  }

  /**
   * Generate chaos error
   */
  generateChaosError() {
    // Generate multiple different types of errors
    const chaosSize = Math.floor(Math.random() * 10) + 1;
    const errors = [];
    
    for (let i = 0; i < chaosSize && this.errorCount < this.maxErrors; i++) {
      const error = this.generateRandomError();
      if (error) {
        errors.push(error);
        this.errorCount++;
      }
    }
    
    return errors[0]; // Return first error
  }

  /**
   * Create error by category
   */
  createErrorByCategory(category, severity) {
    const context = {
      simulation: true,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount
    };

    switch (category) {
      case ERROR_CATEGORY.VALIDATION:
        return ErrorFactory.createValidationError(
          'Simulated validation error',
          'testField',
          'invalidValue',
          context
        );
      
      case ERROR_CATEGORY.AUTHENTICATION:
        return ErrorFactory.createAuthenticationError(
          'Simulated authentication error',
          context
        );
      
      case ERROR_CATEGORY.AUTHORIZATION:
        return ErrorFactory.createAuthorizationError(
          'Simulated authorization error',
          'testResource',
          'testAction',
          context
        );
      
      case ERROR_CATEGORY.NETWORK:
        return ErrorFactory.createNetworkError(
          'Simulated network error',
          'https://example.com/api',
          500,
          context
        );
      
      case ERROR_CATEGORY.DATABASE:
        return ErrorFactory.createDatabaseError(
          'Simulated database error',
          'SELECT * FROM test',
          'test_table',
          context
        );
      
      case ERROR_CATEGORY.EXTERNAL_API:
        return ErrorFactory.createExternalAPIError(
          'Simulated external API error',
          'testService',
          '/api/test',
          500,
          context
        );
      
      case ERROR_CATEGORY.BUSINESS_LOGIC:
        return ErrorFactory.createBusinessLogicError(
          'Simulated business logic error',
          'testOperation',
          context
        );
      
      case ERROR_CATEGORY.SECURITY:
        return ErrorFactory.createSecurityError(
          'Simulated security error',
          'testThreat',
          context
        );
      
      case ERROR_CATEGORY.PERFORMANCE:
        return ErrorFactory.createPerformanceError(
          'Simulated performance error',
          'responseTime',
          5000,
          context
        );
      
      default:
        return ErrorFactory.createBusinessLogicError(
          'Simulated system error',
          'testOperation',
          context
        );
    }
  }

  /**
   * Simulate error
   */
  async simulateError(error) {
    try {
      await errorManager.handleError(error, {
        simulation: true,
        errorCount: this.errorCount
      });
    } catch (simulationError) {
      logger.error('Error simulation failed:', simulationError);
    }
  }

  /**
   * Get random element from array
   */
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get simulation status
   */
  getStatus() {
    return {
      isSimulating: this.isSimulating,
      errorCount: this.errorCount,
      maxErrors: this.maxErrors,
      config: this.simulationConfig
    };
  }
}

/**
 * Chaos Engineering Tools
 */
export class ChaosEngineering {
  constructor() {
    this.errorSimulator = new ErrorSimulator();
    this.circuitBreakerSimulator = new CircuitBreakerSimulator();
  }

  /**
   * Run chaos experiment
   */
  async runExperiment(config) {
    const experiment = {
      name: config.name || 'Chaos Experiment',
      startTime: new Date().toISOString(),
      config,
      results: {}
    };

    logger.info('Chaos experiment started', { experiment: experiment.name });

    try {
      // Start error simulation
      if (config.errorSimulation) {
        experiment.results.errorSimulation = this.errorSimulator.startSimulation(
          config.errorSimulation
        );
      }

      // Start circuit breaker simulation
      if (config.circuitBreakerSimulation) {
        experiment.results.circuitBreakerSimulation = this.circuitBreakerSimulator.startSimulation(
          config.circuitBreakerSimulation
        );
      }

      // Wait for experiment duration
      await this.sleep(config.duration || 60000);

      // Stop simulations
      if (this.errorSimulator.isSimulating) {
        experiment.results.errorSimulation = this.errorSimulator.stopSimulation();
      }

      if (this.circuitBreakerSimulator.isSimulating) {
        experiment.results.circuitBreakerSimulation = this.circuitBreakerSimulator.stopSimulation();
      }

      experiment.endTime = new Date().toISOString();
      experiment.duration = new Date(experiment.endTime) - new Date(experiment.startTime);

      logger.info('Chaos experiment completed', {
        experiment: experiment.name,
        duration: experiment.duration,
        results: experiment.results
      });

      return experiment;
    } catch (error) {
      experiment.error = error.message;
      experiment.endTime = new Date().toISOString();
      
      logger.error('Chaos experiment failed', { experiment: experiment.name, error });
      return experiment;
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker Simulator
 */
export class CircuitBreakerSimulator {
  constructor() {
    this.isSimulating = false;
    this.simulationInterval = null;
    this.services = ['api', 'database', 'external_service'];
  }

  /**
   * Start circuit breaker simulation
   */
  startSimulation(config) {
    if (this.isSimulating) {
      throw new Error('Circuit breaker simulation already running');
    }

    this.isSimulating = true;
    this.services = config.services || this.services;

    logger.info('Circuit breaker simulation started', { services: this.services });

    this.simulationInterval = setInterval(() => {
      this.simulateCircuitBreakerFailure();
    }, config.interval || 5000);

    return {
      services: this.services,
      interval: config.interval || 5000
    };
  }

  /**
   * Stop circuit breaker simulation
   */
  stopSimulation() {
    if (!this.isSimulating) {
      return;
    }

    this.isSimulating = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    logger.info('Circuit breaker simulation stopped');
    return { stopped: true };
  }

  /**
   * Simulate circuit breaker failure
   */
  simulateCircuitBreakerFailure() {
    const service = this.services[Math.floor(Math.random() * this.services.length)];
    
    // Simulate multiple failures to trigger circuit breaker
    for (let i = 0; i < 6; i++) {
      const error = ErrorFactory.createExternalAPIError(
        'Simulated API failure',
        service,
        '/api/test',
        500,
        { simulation: true }
      );
      
      errorManager.handleError(error, { service, simulation: true });
    }
  }
}

/**
 * Error Injection Tools
 */
export class ErrorInjector {
  constructor() {
    this.injections = new Map();
  }

  /**
   * Inject error into function
   */
  injectError(fn, errorConfig) {
    const originalFn = fn;
    const injectionId = this.generateId();

    const wrappedFn = async (...args) => {
      if (this.shouldInjectError(injectionId, errorConfig)) {
        const error = this.createInjectedError(errorConfig);
        throw error;
      }

      return await originalFn(...args);
    };

    this.injections.set(injectionId, {
      fn: wrappedFn,
      originalFn,
      config: errorConfig
    });

    return wrappedFn;
  }

  /**
   * Remove error injection
   */
  removeInjection(injectionId) {
    const injection = this.injections.get(injectionId);
    if (injection) {
      this.injections.delete(injectionId);
      return injection.originalFn;
    }
    return null;
  }

  /**
   * Should inject error
   */
  shouldInjectError(injectionId, config) {
    const probability = config.probability || 0.1;
    return Math.random() < probability;
  }

  /**
   * Create injected error
   */
  createInjectedError(config) {
    const errorType = config.errorType || 'BusinessLogicError';
    const message = config.message || 'Injected error';
    const context = { injection: true, ...config.context };

    return ErrorFactory[`create${errorType}`](message, context);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `injection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export instances
export const errorSimulator = new ErrorSimulator();
export const chaosEngineering = new ChaosEngineering();
export const errorInjector = new ErrorInjector();

export default {
  ErrorSimulator,
  ChaosEngineering,
  ErrorInjector,
  errorSimulator,
  chaosEngineering,
  errorInjector,
  SIMULATION_TYPES
};
