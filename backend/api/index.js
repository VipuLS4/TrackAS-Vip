// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import logger from '../utils/logger.js';
import { 
  requestSizeLimiter, 
  responseSizeLimiter, 
  timeoutHandler 
} from '../middleware/errorHandler.js';
import { completeVercelErrorHandler, monitorVercelErrors } from '../middleware/completeErrorHandler.js';
import { 
  ensureStringResponse, 
  sendJsonResponse, 
  sendErrorResponse 
} from '../utils/responseHelper.js';

// Import routes
import authRoutes from '../routes/auth.js';
import companyRoutes from '../routes/company.js';
import operatorRoutes from '../routes/operator.js';
import adminRoutes from '../routes/admin.js';
import shipmentRoutes from '../routes/shipments.js';
import trackingRoutes from '../routes/tracking.js';
import paymentRoutes from '../routes/payments.js';
import aiRoutes from '../routes/ai.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Error prevention middleware
app.use(monitorVercelErrors()); // Monitor all requests for error tracking
app.use(timeoutHandler(25000)); // 25 second timeout
app.use(requestSizeLimiter('10mb')); // Request size limit
app.use(responseSizeLimiter('6mb')); // Response size limit
app.use(ensureStringResponse); // Ensure all responses are strings

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'FUNCTION_THROTTLED'
  }
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  try {
    const response = { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    sendJsonResponse(res, 200, response);
  } catch (error) {
    logger.error('Health check error:', error);
    sendErrorResponse(res, 500, 'Health check failed', 'Unable to perform health check');
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

// Complete Vercel error handling for all 65 error codes
app.use(completeVercelErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  sendErrorResponse(res, 404, 'Route not found', `The requested route ${req.originalUrl} was not found`);
});

// Export for Vercel
export default app;
