// Main API handler for Vercel
// Routes all API requests to the backend

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';

// Import backend routes
import auth from '../backend/routes/auth.js';
import shipments from '../backend/routes/shipments.js';
import payments from '../backend/routes/payments.js';
import tracking from '../backend/routes/tracking.js';
import health from '../backend/routes/health.js';
import errors from '../backend/routes/errors.js';
import vercel from '../backend/routes/vercel.js';

// Import error handling
import { initializeErrorHandling } from '../backend/utils/errorHandlingIntegration.js';
import { 
  vercelRequestSizeLimiter,
  vercelResponseSizeLimiter,
  vercelTimeoutHandler,
  vercelThrottlingHandler,
  vercelDNSErrorHandler,
  vercelImageOptimizationHandler,
  vercelDeploymentStatusChecker,
  vercelPerformanceMonitor
} from '../backend/middleware/vercelOptimizations.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Initialize comprehensive error handling system
initializeErrorHandling(app);

// Vercel-specific optimizations
app.use(vercelPerformanceMonitor());
app.use(vercelDeploymentStatusChecker());
app.use(vercelDNSErrorHandler());
app.use(vercelImageOptimizationHandler());
app.use(vercelRequestSizeLimiter());
app.use(vercelResponseSizeLimiter());
app.use(vercelTimeoutHandler());
app.use(vercelThrottlingHandler());

// API Routes
app.use('/api/auth', auth);
app.use('/api/shipments', shipments);
app.use('/api/payments', payments);
app.use('/api/tracking', tracking);
app.use('/api/errors', errors);
app.use('/api/vercel', vercel);
app.use('/', health);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'vercel'
  });
});

// Export for Vercel
export default app;
