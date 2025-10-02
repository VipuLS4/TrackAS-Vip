import '../styles.css';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';
import { globalErrorHandler } from './utils/globalErrorHandlers.js';
import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  // Initialize global error handling
  useEffect(() => {
    // Global error handlers are automatically initialized
    console.log('Global error handling system initialized');
  }, []);

  return (
    <ErrorBoundary 
      maxRetries={3} 
      retryDelay={1000}
      errorReportingEnabled={true}
    >
      <Component {...pageProps} />
      <ChatWidget />
    </ErrorBoundary>
  );
}
