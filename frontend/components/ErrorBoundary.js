// Enhanced Error Boundary Component
// Comprehensive error handling with retry mechanisms, user-friendly messages, and error reporting

import React from 'react';
import { ErrorFactory, ErrorResponseFormatter, ERROR_SEVERITY, ERROR_CATEGORY } from '../utils/errorTypes.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: null
    };
    
    this.maxRetries = props.maxRetries || 3;
    this.retryDelay = props.retryDelay || 1000;
    this.errorReportingEnabled = props.errorReportingEnabled !== false;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      lastErrorTime: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Convert to our error type
    const baseError = ErrorFactory.fromUnknownError(error, {
      component: errorInfo.componentStack,
      errorBoundary: this.props.name || 'ErrorBoundary',
      retryCount: this.state.retryCount
    });

    this.setState({
      error: baseError,
      errorInfo: errorInfo
    });

    // Log error details
    console.error('Error Boundary caught an error:', baseError, errorInfo);
    
    // Report error to monitoring service
    if (this.errorReportingEnabled) {
      this.reportError(baseError, errorInfo);
    }
  }

  reportError = async (error, errorInfo) => {
    try {
      const errorData = {
        ...error.toJSON(),
        errorInfo: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.props.name || 'ErrorBoundary'
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, this.retryDelay * (this.state.retryCount + 1)));

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorIcon = (error) => {
    if (error?.category === ERROR_CATEGORY.NETWORK) {
      return (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    }
    
    if (error?.category === ERROR_CATEGORY.AUTHENTICATION) {
      return (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }

    return (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  getErrorColor = (error) => {
    if (error?.severity === ERROR_SEVERITY.CRITICAL) return 'red';
    if (error?.severity === ERROR_SEVERITY.ERROR) return 'red';
    if (error?.severity === ERROR_SEVERITY.WARNING) return 'yellow';
    if (error?.severity === ERROR_SEVERITY.INFO) return 'blue';
    return 'red';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, isRetrying } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const userFriendlyMessage = ErrorResponseFormatter.getUserFriendlyMessage(error);
      const errorColor = this.getErrorColor(error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className={`flex items-center justify-center w-12 h-12 mx-auto bg-${errorColor}-100 rounded-full mb-4`}>
              {this.getErrorIcon(error)}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {error?.category === ERROR_CATEGORY.NETWORK ? 'Connection Problem' :
               error?.category === ERROR_CATEGORY.AUTHENTICATION ? 'Authentication Required' :
               'Something went wrong'}
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              {userFriendlyMessage}
            </p>

            {/* Retry information */}
            {retryCount > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Retry attempt {retryCount} of {this.maxRetries}
                </p>
              </div>
            )}

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                <p className="text-xs text-red-700 mb-2">{error.toString()}</p>
                <p className="text-xs text-red-600 mb-2">
                  <strong>Category:</strong> {error.category} | <strong>Severity:</strong> {error.severity}
                </p>
                <p className="text-xs text-red-600 mb-2">
                  <strong>Correlation ID:</strong> {error.correlationId}
                </p>
                {errorInfo && (
                  <details className="text-xs text-red-600">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              )}
              
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Reset
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {error?.correlationId && `Error ID: ${error.correlationId}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
