import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/vercel-health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Backend is running'
  });
});

// Auth endpoints
app.post('/api/auth', (req, res) => {
  const { action, userType, email, password, token } = req.body;
  
  if (action === 'login') {
    // Demo login logic
    const demoUsers = {
      'company@demo.com': { id: '1', name: 'Demo Company', type: 'company', password: 'password123' },
      'driver@demo.com': { id: '2', name: 'Demo Driver', type: 'driver', password: 'password123' },
      'admin@demo.com': { id: '3', name: 'Demo Admin', type: 'admin', password: 'password123' }
    };
    
    const user = demoUsers[email];
    if (user && user.password === password) {
      res.json({
        success: true,
        data: {
          user: { id: user.id, name: user.name, type: user.type, email },
          token: 'demo-token-' + user.id
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } else if (action === 'profile') {
    // Demo profile logic
    res.json({
      success: true,
      data: {
        user: { id: '1', name: 'Demo User', type: 'company', email: 'company@demo.com' }
      }
    });
  } else {
    res.json({
      success: false,
      message: 'Invalid action'
    });
  }
});

// Shipments endpoints
app.post('/api/shipments', (req, res) => {
  const { action, companyId, driverId, status, limit } = req.body;
  
  if (action === 'list') {
    // Demo shipments data
    const demoShipments = [
      {
        id: '1',
        trackingId: 'TRK123456789',
        pickupAddress: 'Mumbai, Maharashtra',
        deliveryAddress: 'Delhi, Delhi',
        status: 'pending',
        value: 1500,
        weight: 2.5,
        createdAt: new Date().toISOString(),
        companyId: '1',
        driverId: null
      },
      {
        id: '2',
        trackingId: 'TRK987654321',
        pickupAddress: 'Bangalore, Karnataka',
        deliveryAddress: 'Chennai, Tamil Nadu',
        status: 'in_transit',
        value: 2000,
        weight: 3.0,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        companyId: '1',
        driverId: '2'
      }
    ];
    
    let filteredShipments = demoShipments;
    
    if (companyId) {
      filteredShipments = demoShipments.filter(s => s.companyId === companyId);
    }
    if (driverId) {
      filteredShipments = demoShipments.filter(s => s.driverId === driverId);
    }
    if (status) {
      filteredShipments = demoShipments.filter(s => s.status === status);
    }
    
    res.json({
      success: true,
      data: {
        shipments: filteredShipments.slice(0, limit || 50)
      }
    });
  } else if (action === 'create') {
    // Demo create shipment
    const newShipment = {
      id: Date.now().toString(),
      trackingId: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        shipment: newShipment
      }
    });
  } else if (action === 'update') {
    res.json({
      success: true,
      data: {
        shipment: { ...req.body, updatedAt: new Date().toISOString() }
      }
    });
  } else if (action === 'update-status') {
    res.json({
      success: true,
      data: {
        shipment: { ...req.body, updatedAt: new Date().toISOString() }
      }
    });
  } else {
    res.json({
      success: false,
      message: 'Invalid action'
    });
  }
});

// Payments endpoints
app.post('/api/payments', (req, res) => {
  const { action, userId, status, limit } = req.body;
  
  if (action === 'wallet') {
    res.json({
      success: true,
      data: {
        wallet: {
          id: '1',
          userId: userId || '1',
          balance: 5000,
          currency: 'INR',
          updatedAt: new Date().toISOString()
        }
      }
    });
  } else if (action === 'transactions') {
    const demoTransactions = [
      {
        id: '1',
        type: 'credit',
        amount: 1500,
        description: 'Shipment delivery payment',
        status: 'completed',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'debit',
        amount: 2000,
        description: 'Shipment creation payment',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: {
        transactions: demoTransactions.slice(0, limit || 50)
      }
    });
  } else if (action === 'list') {
    res.json({
      success: true,
      data: {
        payments: []
      }
    });
  } else if (action === 'release') {
    res.json({
      success: true,
      data: {
        payment: { ...req.body, status: 'released', updatedAt: new Date().toISOString() }
      }
    });
  } else {
    res.json({
      success: false,
      message: 'Invalid action'
    });
  }
});

// Admin endpoints
app.post('/api/admin', (req, res) => {
  const { action } = req.body;
  
  if (action === 'dashboard') {
    res.json({
      success: true,
      data: {
        stats: {
          totalCompanies: 5,
          totalOperators: 12,
          totalShipments: 45,
          totalRevenue: 125000
        },
        pendingApprovals: {
          companies: [],
          operators: [],
          vehicles: []
        }
      }
    });
  } else if (action === 'approve') {
    res.json({
      success: true,
      data: {
        approval: { ...req.body, status: 'approved', updatedAt: new Date().toISOString() }
      }
    });
  } else {
    res.json({
      success: false,
      message: 'Invalid action'
    });
  }
});

// Tracking endpoint
app.get('/api/tracking/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  
  // Demo tracking data
  const demoTracking = {
    id: '1',
    trackingId: trackingId,
    status: 'in_transit',
    pickupAddress: 'Mumbai, Maharashtra',
    deliveryAddress: 'Delhi, Delhi',
    currentLocation: 'Pune, Maharashtra',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    events: [
      {
        id: '1',
        status: 'pending',
        location: 'Mumbai, Maharashtra',
        description: 'Shipment created',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        status: 'picked_up',
        location: 'Mumbai, Maharashtra',
        description: 'Package picked up',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        status: 'in_transit',
        location: 'Pune, Maharashtra',
        description: 'In transit to destination',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  res.json({
    success: true,
    data: {
      tracking: demoTracking
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TrackAS backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/vercel-health`);
});

export default app;
