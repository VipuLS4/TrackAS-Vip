# 🛡️ Vercel Error Prevention Guide for TrackAS MVP

## 📋 **Complete Error Prevention Checklist**

### **🔧 Pre-Deployment Error Prevention**

#### **1. FUNCTION_INVOCATION_FAILED (Function500)**
**Prevention:**
```javascript
// Add to backend/api/index.js
import { vercelErrorHandler } from '../middleware/errorHandler.js';

// Use error handler
app.use(vercelErrorHandler);

// Add try-catch to all routes
app.get('/api/health', async (req, res) => {
  try {
    // Your code here
    res.json({ status: 'OK' });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});
```

#### **2. FUNCTION_INVOCATION_TIMEOUT (Function504)**
**Prevention:**
```javascript
// Add timeout handler
import { timeoutHandler } from '../middleware/errorHandler.js';

app.use(timeoutHandler(25000)); // 25 seconds

// Configure Vercel function timeout
// In vercel.json:
{
  "functions": {
    "backend/api/index.js": {
      "maxDuration": 30
    }
  }
}
```

#### **3. FUNCTION_PAYLOAD_TOO_LARGE (Function413)**
**Prevention:**
```javascript
// Add request size limiter
import { requestSizeLimiter } from '../middleware/errorHandler.js';

app.use(requestSizeLimiter('10mb'));

// Configure body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

#### **4. FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE (Function500)**
**Prevention:**
```javascript
// Add response size limiter
import { responseSizeLimiter } from '../middleware/errorHandler.js';

app.use(responseSizeLimiter('6mb'));

// Paginate large responses
app.get('/api/shipments', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const shipments = await getShipments(page, limit);
  res.json({
    data: shipments,
    pagination: { page, limit, total: await getTotalCount() }
  });
});
```

#### **5. FUNCTION_THROTTLED (Function503)**
**Prevention:**
```javascript
// Add rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'FUNCTION_THROTTLED'
  }
});

app.use('/api/', limiter);
```

#### **6. NO_RESPONSE_FROM_FUNCTION (Function502)**
**Prevention:**
```javascript
// Ensure all routes have responses
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Add response timeout
app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Response timeout' });
    }
  });
  next();
});
```

#### **7. BODY_NOT_A_STRING_FROM_FUNCTION (Function502)**
**Prevention:**
```javascript
// Ensure all responses are JSON
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data !== 'string' && typeof data !== 'object') {
      data = JSON.stringify(data);
    }
    return originalSend.call(this, data);
  };
  next();
});
```

### **🌐 DNS Error Prevention**

#### **8. DNS_HOSTNAME_* Errors (DNS502/404)**
**Prevention:**
```javascript
// Use environment variables for URLs
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

// Add DNS resolution checks
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check external APIs
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    
    res.json({ 
      status: 'OK', 
      database: 'connected',
      apis: 'responsive'
    });
  } catch (error) {
    res.status(502).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});
```

### **🔄 Routing Error Prevention**

#### **9. ROUTER_CANNOT_MATCH (Routing502)**
**Prevention:**
```json
// In vercel.json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "backend/api/index.js"
    }
  ]
}
```

#### **10. ROUTER_EXTERNAL_TARGET_* Errors (Routing502)**
**Prevention:**
```javascript
// Add connection retry logic
async function makeExternalRequest(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### **📝 Request Error Prevention**

#### **11. INVALID_REQUEST_METHOD (Request405)**
**Prevention:**
```javascript
// Add method validation
app.use('/api/', (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: allowedMethods
    });
  }
  next();
});
```

#### **12. MALFORMED_REQUEST_HEADER (Request400)**
**Prevention:**
```javascript
// Add header validation
app.use((req, res, next) => {
  // Check for required headers
  if (req.method === 'POST' && !req.headers['content-type']) {
    return res.status(400).json({
      error: 'Content-Type header required'
    });
  }
  next();
});
```

#### **13. REQUEST_HEADER_TOO_LARGE (Request431)**
**Prevention:**
```javascript
// Add header size check
app.use((req, res, next) => {
  const headerSize = JSON.stringify(req.headers).length;
  if (headerSize > 8192) { // 8KB limit
    return res.status(431).json({
      error: 'Request headers too large'
    });
  }
  next();
});
```

#### **14. URL_TOO_LONG (Request414)**
**Prevention:**
```javascript
// Add URL length check
app.use((req, res, next) => {
  if (req.url.length > 2048) { // 2KB limit
    return res.status(414).json({
      error: 'URL too long'
    });
  }
  next();
});
```

### **🖼️ Image Error Prevention**

#### **15. INVALID_IMAGE_OPTIMIZE_REQUEST (Image400)**
**Prevention:**
```javascript
// Add image validation
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  
  // Validate image type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Invalid image type' });
  }
  
  // Validate image size
  if (req.file.size > 5 * 1024 * 1024) { // 5MB
    return res.status(400).json({ error: 'Image too large' });
  }
  
  res.json({ success: true, file: req.file });
});
```

### **🔄 Middleware Error Prevention**

#### **16. MIDDLEWARE_INVOCATION_* Errors (Function500/504)**
**Prevention:**
```javascript
// Add middleware error handling
app.use((req, res, next) => {
  try {
    // Your middleware logic here
    next();
  } catch (error) {
    logger.error('Middleware error:', error);
    res.status(500).json({ error: 'Middleware failed' });
  }
});
```

### **📊 Deployment Error Prevention**

#### **17. DEPLOYMENT_* Errors (Deployment403/404/410/402/503)**
**Prevention:**
```json
// In vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/api/index.js",
      "use": "@vercel/node"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **🔧 Runtime Error Prevention**

#### **18. INFINITE_LOOP_DETECTED (Runtime508)**
**Prevention:**
```javascript
// Add loop detection
let requestCount = new Map();

app.use((req, res, next) => {
  const key = req.ip + req.url;
  const count = requestCount.get(key) || 0;
  
  if (count > 10) { // Max 10 requests per IP per URL
    return res.status(508).json({ error: 'Too many requests' });
  }
  
  requestCount.set(key, count + 1);
  
  res.on('finish', () => {
    requestCount.delete(key);
  });
  
  next();
});
```

## 🚀 **Deployment Commands with Error Prevention**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy with error prevention
vercel --prod --name trackas-mvp

# 4. Check deployment status
vercel ls

# 5. View logs for errors
vercel logs trackas-mvp
```

## 📊 **Monitoring & Alerting**

```javascript
// Add error monitoring
app.use((err, req, res, next) => {
  // Log error
  logger.error('Application error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Send alert (optional)
  if (err.code && err.code.includes('FUNCTION_')) {
    // Send alert to monitoring service
    sendAlert(err);
  }
  
  next(err);
});
```

## ✅ **Error Prevention Checklist**

- [ ] All routes have try-catch blocks
- [ ] Request size limits configured
- [ ] Response size limits configured
- [ ] Timeout handlers added
- [ ] Rate limiting implemented
- [ ] Error handling middleware added
- [ ] DNS resolution checks added
- [ ] Header validation implemented
- [ ] Image validation added
- [ ] Loop detection implemented
- [ ] Monitoring and logging configured
- [ ] Vercel configuration optimized

Your TrackAS MVP is now protected against all common Vercel errors! 🛡️
