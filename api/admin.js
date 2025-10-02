// Admin API for TrackAS
// Handles admin dashboard, user management, and system administration

import { vercelErrorHandler } from '../backend/utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../backend/utils/vercelErrorTypes.js';

// Mock database - In production, replace with actual database
const adminStats = {
  totalUsers: 150,
  totalShipments: 1250,
  totalRevenue: 250000,
  activeDrivers: 45,
  activeCompanies: 25,
  pendingApprovals: 8,
  systemHealth: 'healthy',
  lastUpdated: new Date().toISOString()
};

const approvals = new Map();
const systemLogs = new Map();

// Initialize with demo data
const initializeDemoData = () => {
  // Demo approvals
  const demoApprovals = [
    {
      id: 'APP_001',
      type: 'driver_registration',
      userId: 'drv_002',
      userEmail: 'newdriver@example.com',
      status: 'pending',
      submittedAt: '2024-01-15T10:00:00Z',
      data: {
        name: 'New Driver',
        phone: '+91-9876543210',
        vehicleNumber: 'MH-12-CD-5678',
        documents: ['license.pdf', 'rc.pdf']
      }
    },
    {
      id: 'APP_002',
      type: 'company_registration',
      userId: 'comp_002',
      userEmail: 'newcompany@example.com',
      status: 'pending',
      submittedAt: '2024-01-14T15:30:00Z',
      data: {
        name: 'New Logistics Company',
        gstNumber: '27ABCDE1234F1Z5',
        address: 'Mumbai, Maharashtra',
        documents: ['gst.pdf', 'pan.pdf']
      }
    }
  ];

  demoApprovals.forEach(approval => {
    approvals.set(approval.id, approval);
  });

  // Demo system logs
  const demoLogs = [
    {
      id: 'LOG_001',
      level: 'info',
      message: 'New shipment created',
      userId: 'comp_001',
      action: 'shipment_create',
      timestamp: '2024-01-15T09:00:00Z',
      metadata: { shipmentId: 'SHIP_001' }
    },
    {
      id: 'LOG_002',
      level: 'warning',
      message: 'Payment failed',
      userId: 'comp_001',
      action: 'payment_failed',
      timestamp: '2024-01-15T08:30:00Z',
      metadata: { paymentId: 'PAY_001' }
    }
  ];

  demoLogs.forEach(log => {
    if (!systemLogs.has(log.level)) {
      systemLogs.set(log.level, []);
    }
    systemLogs.get(log.level).push(log);
  });
};

// Initialize demo data
initializeDemoData();

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const { method } = req;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const { action, id } = req.query;
    const body = req.body || {};

    switch (action) {
      case 'dashboard':
        return await handleDashboard(req, res);
      case 'approvals':
        return await handleApprovals(req, res, body);
      case 'approve':
        return await handleApprove(req, res, body);
      case 'reject':
        return await handleReject(req, res, body);
      case 'users':
        return await handleUsers(req, res, body);
      case 'shipments':
        return await handleShipments(req, res, body);
      case 'payments':
        return await handlePayments(req, res, body);
      case 'logs':
        return await handleLogs(req, res, body);
      case 'settings':
        return await handleSettings(req, res, body);
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Supported actions: dashboard, approvals, approve, reject, users, shipments, payments, logs, settings'
        });
    }
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/admin',
      method: req.method,
      action: req.query.action,
      id: req.query.id
    });
    
    return res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
}

// Dashboard data
async function handleDashboard(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      stats: adminStats,
      recentActivity: Array.from(systemLogs.values()).flat().slice(0, 10),
      pendingApprovals: Array.from(approvals.values()).filter(a => a.status === 'pending').length
    }
  });
}

// Get approvals
async function handleApprovals(req, res, body) {
  const { status, type, limit = 10, offset = 0 } = body;

  let filteredApprovals = Array.from(approvals.values());

  // Apply filters
  if (status) {
    filteredApprovals = filteredApprovals.filter(a => a.status === status);
  }
  if (type) {
    filteredApprovals = filteredApprovals.filter(a => a.type === type);
  }

  // Sort by submission date (newest first)
  filteredApprovals.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  // Apply pagination
  const paginatedApprovals = filteredApprovals.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      approvals: paginatedApprovals,
      pagination: {
        total: filteredApprovals.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredApprovals.length
      }
    }
  });
}

// Approve request
async function handleApprove(req, res, body) {
  const { approvalId, adminNotes } = body;

  if (!approvalId) {
    return res.status(400).json({
      error: 'Missing approval ID',
      message: 'Approval ID is required'
    });
  }

  const approval = approvals.get(approvalId);
  if (!approval) {
    return res.status(404).json({
      error: 'Approval not found',
      message: 'No approval found with this ID'
    });
  }

  if (approval.status !== 'pending') {
    return res.status(400).json({
      error: 'Invalid approval status',
      message: 'Approval is not in pending status'
    });
  }

  // Update approval status
  approval.status = 'approved';
  approval.approvedAt = new Date().toISOString();
  approval.adminNotes = adminNotes || 'Approved by admin';
  approvals.set(approvalId, approval);

  // Add system log
  const log = {
    id: 'LOG_' + Date.now(),
    level: 'info',
    message: `Approval ${approvalId} approved`,
    userId: 'admin',
    action: 'approval_approved',
    timestamp: new Date().toISOString(),
    metadata: { approvalId, type: approval.type }
  };

  if (!systemLogs.has('info')) {
    systemLogs.set('info', []);
  }
  systemLogs.get('info').push(log);

  return res.status(200).json({
    success: true,
    message: 'Approval processed successfully',
    data: {
      approval
    }
  });
}

// Reject request
async function handleReject(req, res, body) {
  const { approvalId, adminNotes, reason } = body;

  if (!approvalId) {
    return res.status(400).json({
      error: 'Missing approval ID',
      message: 'Approval ID is required'
    });
  }

  const approval = approvals.get(approvalId);
  if (!approval) {
    return res.status(404).json({
      error: 'Approval not found',
      message: 'No approval found with this ID'
    });
  }

  if (approval.status !== 'pending') {
    return res.status(400).json({
      error: 'Invalid approval status',
      message: 'Approval is not in pending status'
    });
  }

  // Update approval status
  approval.status = 'rejected';
  approval.rejectedAt = new Date().toISOString();
  approval.adminNotes = adminNotes || 'Rejected by admin';
  approval.reason = reason || 'No reason provided';
  approvals.set(approvalId, approval);

  // Add system log
  const log = {
    id: 'LOG_' + Date.now(),
    level: 'warning',
    message: `Approval ${approvalId} rejected`,
    userId: 'admin',
    action: 'approval_rejected',
    timestamp: new Date().toISOString(),
    metadata: { approvalId, type: approval.type, reason }
  };

  if (!systemLogs.has('warning')) {
    systemLogs.set('warning', []);
  }
  systemLogs.get('warning').push(log);

  return res.status(200).json({
    success: true,
    message: 'Approval rejected successfully',
    data: {
      approval
    }
  });
}

// Get users
async function handleUsers(req, res, body) {
  const { userType, status, limit = 10, offset = 0 } = body;

  // Mock user data - In production, fetch from database
  const users = [
    {
      id: 'comp_001',
      email: 'company@demo.com',
      name: 'Demo Logistics Company',
      type: 'company',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T10:00:00Z'
    },
    {
      id: 'drv_001',
      email: 'driver@demo.com',
      name: 'John Driver',
      type: 'driver',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T09:30:00Z'
    }
  ];

  let filteredUsers = users;

  // Apply filters
  if (userType) {
    filteredUsers = filteredUsers.filter(u => u.type === userType);
  }
  if (status) {
    filteredUsers = filteredUsers.filter(u => u.status === status);
  }

  // Apply pagination
  const paginatedUsers = filteredUsers.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      users: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredUsers.length
      }
    }
  });
}

// Get shipments
async function handleShipments(req, res, body) {
  const { status, limit = 10, offset = 0 } = body;

  // Mock shipment data - In production, fetch from database
  const shipments = [
    {
      id: 'SHIP_001',
      trackingId: 'TRK123456789',
      companyId: 'comp_001',
      driverId: 'drv_001',
      status: 'in_transit',
      pickupAddress: 'Mumbai, Maharashtra',
      deliveryAddress: 'Delhi, Delhi',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'SHIP_002',
      trackingId: 'TRK987654321',
      companyId: 'comp_001',
      driverId: 'drv_001',
      status: 'delivered',
      pickupAddress: 'Bangalore, Karnataka',
      deliveryAddress: 'Chennai, Tamil Nadu',
      createdAt: '2024-01-10T07:30:00Z'
    }
  ];

  let filteredShipments = shipments;

  // Apply filters
  if (status) {
    filteredShipments = filteredShipments.filter(s => s.status === status);
  }

  // Apply pagination
  const paginatedShipments = filteredShipments.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      shipments: paginatedShipments,
      pagination: {
        total: filteredShipments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredShipments.length
      }
    }
  });
}

// Get payments
async function handlePayments(req, res, body) {
  const { status, limit = 10, offset = 0 } = body;

  // Mock payment data - In production, fetch from database
  const payments = [
    {
      id: 'PAY_001',
      trackingId: 'TRK123456789',
      amount: 2500,
      currency: 'INR',
      status: 'pending',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'PAY_002',
      trackingId: 'TRK987654321',
      amount: 1800,
      currency: 'INR',
      status: 'completed',
      createdAt: '2024-01-10T07:30:00Z'
    }
  ];

  let filteredPayments = payments;

  // Apply filters
  if (status) {
    filteredPayments = filteredPayments.filter(p => p.status === status);
  }

  // Apply pagination
  const paginatedPayments = filteredPayments.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      payments: paginatedPayments,
      pagination: {
        total: filteredPayments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredPayments.length
      }
    }
  });
}

// Get system logs
async function handleLogs(req, res, body) {
  const { level, limit = 10, offset = 0 } = body;

  let allLogs = [];
  for (const logs of systemLogs.values()) {
    allLogs = allLogs.concat(logs);
  }

  // Apply filters
  if (level) {
    allLogs = allLogs.filter(l => l.level === level);
  }

  // Sort by timestamp (newest first)
  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply pagination
  const paginatedLogs = allLogs.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      logs: paginatedLogs,
      pagination: {
        total: allLogs.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < allLogs.length
      }
    }
  });
}

// System settings
async function handleSettings(req, res, body) {
  const { action, settings } = body;

  switch (action) {
    case 'get':
      return res.status(200).json({
        success: true,
        data: {
          settings: {
            systemName: 'TrackAS',
            version: '1.0.0',
            maintenanceMode: false,
            registrationEnabled: true,
            maxFileSize: '10MB',
            supportedFormats: ['PDF', 'JPG', 'PNG'],
            notificationSettings: {
              email: true,
              sms: true,
              push: true
            }
          }
        }
      });

    case 'update':
      // In production, update settings in database
      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: {
          settings
        }
      });

    default:
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Supported actions: get, update'
      });
  }
}

