import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { enhancedLogger } from './utils/logger.js';
import { initializeErrorHandling } from './utils/errorHandlingIntegration.js';
import auth from './routes/auth.js';
import shipments from './routes/shipments.js';
import payments from './routes/payments.js';
import ai from './routes/ai.js';
import faqs from './routes/faqs.js';
import tickets from './routes/tickets.js';
import admin from './routes/admin.js';
import company from './routes/company.js';
import operator from './routes/operator.js';
import notifications from './routes/notifications.js';
import ratings from './routes/ratings.js';
import tracking from './routes/tracking.js';
import health from './routes/health.js';
import errors from './routes/errors.js';
import vercel from './routes/vercel.js';
import { 
  withVercelErrorHandling,
  vercelRequestSizeLimiter,
  vercelResponseSizeLimiter,
  vercelTimeoutHandler,
  vercelThrottlingHandler,
  vercelDNSErrorHandler,
  vercelImageOptimizationHandler,
  vercelDeploymentStatusChecker,
  vercelPerformanceMonitor
} from './middleware/vercelOptimizations.js';

const app = express();

// Security middleware
app.use(helmet());
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
app.use('/api/', limiter);

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

// Routes
app.use('/api/auth', auth);
app.use('/api/shipments', shipments);
app.use('/api/payments', payments);
app.use('/api/ai', ai);
app.use('/api/faqs', faqs);
app.use('/api/tickets', tickets);
app.use('/api/admin', admin);
app.use('/api/company', company);
app.use('/api/operator', operator);
app.use('/api/notifications', notifications);
app.use('/api/ratings', ratings);
app.use('/api/tracking', tracking);
app.use('/api/errors', errors);
app.use('/api/vercel', vercel);
app.use('/', health);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  enhancedLogger.info(`TrackAS backend running on port ${port}`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    errorHandling: 'enabled'
  });
  console.log('TrackAS backend running on', port);
  console.log('Comprehensive error handling system initialized');
});
