// Shipments API for TrackAS
// Handles shipment creation, tracking, and management

import { vercelErrorHandler } from '../backend/utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../backend/utils/vercelErrorTypes.js';

// Mock database - In production, replace with actual database
const shipments = new Map();
const trackingEvents = new Map();

// Initialize with demo data
const initializeDemoData = () => {
  const demoShipments = [
    {
      id: 'SHIP_001',
      trackingId: 'TRK123456789',
      companyId: 'comp_001',
      driverId: 'drv_001',
      status: 'in_transit',
      pickupAddress: 'Mumbai, Maharashtra',
      deliveryAddress: 'Delhi, Delhi',
      pickupDate: '2024-01-15T10:00:00Z',
      estimatedDelivery: '2024-01-17T18:00:00Z',
      actualDelivery: null,
      weight: 25.5,
      dimensions: '30x20x15 cm',
      description: 'Electronics Package',
      value: 15000,
      paymentStatus: 'pending',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-16T14:30:00Z'
    },
    {
      id: 'SHIP_002',
      trackingId: 'TRK987654321',
      companyId: 'comp_001',
      driverId: 'drv_001',
      status: 'delivered',
      pickupAddress: 'Bangalore, Karnataka',
      deliveryAddress: 'Chennai, Tamil Nadu',
      pickupDate: '2024-01-10T08:00:00Z',
      estimatedDelivery: '2024-01-12T16:00:00Z',
      actualDelivery: '2024-01-12T15:30:00Z',
      weight: 12.3,
      dimensions: '25x15x10 cm',
      description: 'Documents Package',
      value: 5000,
      paymentStatus: 'completed',
      createdAt: '2024-01-10T07:30:00Z',
      updatedAt: '2024-01-12T15:30:00Z'
    }
  ];

  demoShipments.forEach(shipment => {
    shipments.set(shipment.trackingId, shipment);
  });

  // Demo tracking events
  const demoEvents = [
    {
      id: 'EVT_001',
      shipmentId: 'TRK123456789',
      status: 'picked_up',
      location: 'Mumbai, Maharashtra',
      timestamp: '2024-01-15T10:15:00Z',
      description: 'Package picked up from sender',
      driverId: 'drv_001',
      coordinates: { lat: 19.0760, lng: 72.8777 }
    },
    {
      id: 'EVT_002',
      shipmentId: 'TRK123456789',
      status: 'in_transit',
      location: 'Pune, Maharashtra',
      timestamp: '2024-01-16T08:30:00Z',
      description: 'Package in transit to destination',
      driverId: 'drv_001',
      coordinates: { lat: 18.5204, lng: 73.8567 }
    },
    {
      id: 'EVT_003',
      shipmentId: 'TRK987654321',
      status: 'delivered',
      location: 'Chennai, Tamil Nadu',
      timestamp: '2024-01-12T15:30:00Z',
      description: 'Package delivered successfully',
      driverId: 'drv_001',
      coordinates: { lat: 13.0827, lng: 80.2707 }
    }
  ];

  demoEvents.forEach(event => {
    if (!trackingEvents.has(event.shipmentId)) {
      trackingEvents.set(event.shipmentId, []);
    }
    trackingEvents.get(event.shipmentId).push(event);
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

    const { action, trackingId } = req.query;
    const body = req.body || {};

    switch (action) {
      case 'create':
        return await handleCreateShipment(req, res, body);
      case 'track':
        return await handleTrackShipment(req, res, trackingId);
      case 'list':
        return await handleListShipments(req, res, body);
      case 'update':
        return await handleUpdateShipment(req, res, body);
      case 'update-status':
        return await handleUpdateStatus(req, res, body);
      case 'add-event':
        return await handleAddEvent(req, res, body);
      case 'get-events':
        return await handleGetEvents(req, res, trackingId);
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Supported actions: create, track, list, update, update-status, add-event, get-events'
        });
    }
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/shipments',
      method: req.method,
      action: req.query.action,
      trackingId: req.query.trackingId
    });
    
    return res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
}

// Create shipment
async function handleCreateShipment(req, res, body) {
  const {
    companyId,
    pickupAddress,
    deliveryAddress,
    weight,
    dimensions,
    description,
    value,
    estimatedDelivery
  } = body;

  if (!companyId || !pickupAddress || !deliveryAddress) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Company ID, pickup address, and delivery address are required'
    });
  }

  // Generate tracking ID
  const trackingId = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const shipmentId = 'SHIP_' + Date.now();

  const shipment = {
    id: shipmentId,
    trackingId,
    companyId,
    driverId: null,
    status: 'pending',
    pickupAddress,
    deliveryAddress,
    pickupDate: null,
    estimatedDelivery: estimatedDelivery || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    actualDelivery: null,
    weight: weight || 0,
    dimensions: dimensions || '',
    description: description || '',
    value: value || 0,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  shipments.set(trackingId, shipment);

  return res.status(201).json({
    success: true,
    message: 'Shipment created successfully',
    data: {
      shipment,
      trackingUrl: `${process.env.VERCEL_URL || 'https://trackas-mvp.vercel.app'}/track/${trackingId}`
    }
  });
}

// Track shipment
async function handleTrackShipment(req, res, trackingId) {
  if (!trackingId) {
    return res.status(400).json({
      error: 'Missing tracking ID',
      message: 'Tracking ID is required'
    });
  }

  const shipment = shipments.get(trackingId);
  if (!shipment) {
    return res.status(404).json({
      error: 'Shipment not found',
      message: 'No shipment found with this tracking ID'
    });
  }

  const events = trackingEvents.get(trackingId) || [];

  return res.status(200).json({
    success: true,
    data: {
      shipment,
      events: events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  });
}

// List shipments
async function handleListShipments(req, res, body) {
  const { companyId, driverId, status, limit = 10, offset = 0 } = body;

  let filteredShipments = Array.from(shipments.values());

  // Apply filters
  if (companyId) {
    filteredShipments = filteredShipments.filter(s => s.companyId === companyId);
  }
  if (driverId) {
    filteredShipments = filteredShipments.filter(s => s.driverId === driverId);
  }
  if (status) {
    filteredShipments = filteredShipments.filter(s => s.status === status);
  }

  // Sort by creation date (newest first)
  filteredShipments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

// Update shipment
async function handleUpdateShipment(req, res, body) {
  const { trackingId, ...updateData } = body;

  if (!trackingId) {
    return res.status(400).json({
      error: 'Missing tracking ID',
      message: 'Tracking ID is required'
    });
  }

  const shipment = shipments.get(trackingId);
  if (!shipment) {
    return res.status(404).json({
      error: 'Shipment not found',
      message: 'No shipment found with this tracking ID'
    });
  }

  // Update shipment
  const updatedShipment = {
    ...shipment,
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  shipments.set(trackingId, updatedShipment);

  return res.status(200).json({
    success: true,
    message: 'Shipment updated successfully',
    data: {
      shipment: updatedShipment
    }
  });
}

// Update shipment status
async function handleUpdateStatus(req, res, body) {
  const { trackingId, status, location, description, driverId, coordinates } = body;

  if (!trackingId || !status) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Tracking ID and status are required'
    });
  }

  const shipment = shipments.get(trackingId);
  if (!shipment) {
    return res.status(404).json({
      error: 'Shipment not found',
      message: 'No shipment found with this tracking ID'
    });
  }

  // Update shipment status
  const updatedShipment = {
    ...shipment,
    status,
    updatedAt: new Date().toISOString()
  };

  if (status === 'delivered') {
    updatedShipment.actualDelivery = new Date().toISOString();
  }

  shipments.set(trackingId, updatedShipment);

  // Add tracking event
  const event = {
    id: 'EVT_' + Date.now(),
    shipmentId: trackingId,
    status,
    location: location || shipment.deliveryAddress,
    timestamp: new Date().toISOString(),
    description: description || `Status updated to ${status}`,
    driverId: driverId || shipment.driverId,
    coordinates: coordinates || null
  };

  if (!trackingEvents.has(trackingId)) {
    trackingEvents.set(trackingId, []);
  }
  trackingEvents.get(trackingId).push(event);

  return res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: {
      shipment: updatedShipment,
      event
    }
  });
}

// Add tracking event
async function handleAddEvent(req, res, body) {
  const { trackingId, status, location, description, driverId, coordinates } = body;

  if (!trackingId || !status) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Tracking ID and status are required'
    });
  }

  const shipment = shipments.get(trackingId);
  if (!shipment) {
    return res.status(404).json({
      error: 'Shipment not found',
      message: 'No shipment found with this tracking ID'
    });
  }

  const event = {
    id: 'EVT_' + Date.now(),
    shipmentId: trackingId,
    status,
    location: location || shipment.deliveryAddress,
    timestamp: new Date().toISOString(),
    description: description || `Event: ${status}`,
    driverId: driverId || shipment.driverId,
    coordinates: coordinates || null
  };

  if (!trackingEvents.has(trackingId)) {
    trackingEvents.set(trackingId, []);
  }
  trackingEvents.get(trackingId).push(event);

  return res.status(201).json({
    success: true,
    message: 'Event added successfully',
    data: {
      event
    }
  });
}

// Get tracking events
async function handleGetEvents(req, res, trackingId) {
  if (!trackingId) {
    return res.status(400).json({
      error: 'Missing tracking ID',
      message: 'Tracking ID is required'
    });
  }

  const events = trackingEvents.get(trackingId) || [];

  return res.status(200).json({
    success: true,
    data: {
      events: events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  });
}

