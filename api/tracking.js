// Tracking API for TrackAS
// Handles public shipment tracking and status updates

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
      shipmentId: 'TRK123456789',
      status: 'in_transit',
      location: 'Indore, Madhya Pradesh',
      timestamp: '2024-01-16T14:45:00Z',
      description: 'Package in transit to destination',
      driverId: 'drv_001',
      coordinates: { lat: 22.7196, lng: 75.8577 }
    },
    {
      id: 'EVT_004',
      shipmentId: 'TRK987654321',
      status: 'picked_up',
      location: 'Bangalore, Karnataka',
      timestamp: '2024-01-10T08:15:00Z',
      description: 'Package picked up from sender',
      driverId: 'drv_001',
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    {
      id: 'EVT_005',
      shipmentId: 'TRK987654321',
      status: 'in_transit',
      location: 'Chennai, Tamil Nadu',
      timestamp: '2024-01-12T10:30:00Z',
      description: 'Package in transit to destination',
      driverId: 'drv_001',
      coordinates: { lat: 13.0827, lng: 80.2707 }
    },
    {
      id: 'EVT_006',
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

    const { trackingId } = req.query;
    const body = req.body || {};

    if (method === 'GET') {
      return await handleTrackShipment(req, res, trackingId);
    } else if (method === 'POST') {
      return await handleUpdateLocation(req, res, body);
    } else {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET and POST methods are allowed'
      });
    }
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/tracking',
      method: req.method,
      trackingId: req.query.trackingId
    });
    
    return res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
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
  
  // Sort events by timestamp (newest first)
  const sortedEvents = events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Calculate progress percentage
  const progressPercentage = calculateProgress(shipment.status);

  // Get current location
  const currentLocation = sortedEvents.length > 0 ? sortedEvents[0].location : shipment.pickupAddress;

  // Calculate estimated delivery time
  const estimatedDelivery = new Date(shipment.estimatedDelivery);
  const now = new Date();
  const timeRemaining = estimatedDelivery.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60)));

  return res.status(200).json({
    success: true,
    data: {
      shipment: {
        id: shipment.id,
        trackingId: shipment.trackingId,
        status: shipment.status,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        pickupDate: shipment.pickupDate,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        weight: shipment.weight,
        dimensions: shipment.dimensions,
        description: shipment.description,
        currentLocation,
        progressPercentage,
        hoursRemaining: shipment.status === 'delivered' ? 0 : hoursRemaining
      },
      events: sortedEvents,
      timeline: generateTimeline(shipment, sortedEvents)
    }
  });
}

// Update location (for drivers)
async function handleUpdateLocation(req, res, body) {
  const { trackingId, status, location, description, coordinates } = body;

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

  // Create new tracking event
  const event = {
    id: 'EVT_' + Date.now(),
    shipmentId: trackingId,
    status,
    location: location || shipment.deliveryAddress,
    timestamp: new Date().toISOString(),
    description: description || `Status updated to ${status}`,
    driverId: shipment.driverId,
    coordinates: coordinates || null
  };

  // Add event to tracking events
  if (!trackingEvents.has(trackingId)) {
    trackingEvents.set(trackingId, []);
  }
  trackingEvents.get(trackingId).push(event);

  // Update shipment status
  shipment.status = status;
  shipment.updatedAt = new Date().toISOString();
  
  if (status === 'delivered') {
    shipment.actualDelivery = new Date().toISOString();
  }

  shipments.set(trackingId, shipment);

  return res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    data: {
      event,
      shipment: {
        id: shipment.id,
        trackingId: shipment.trackingId,
        status: shipment.status,
        updatedAt: shipment.updatedAt
      }
    }
  });
}

// Calculate progress percentage based on status
function calculateProgress(status) {
  const progressMap = {
    'pending': 0,
    'picked_up': 20,
    'in_transit': 60,
    'out_for_delivery': 80,
    'delivered': 100,
    'cancelled': 0,
    'returned': 0
  };
  
  return progressMap[status] || 0;
}

// Generate timeline for tracking
function generateTimeline(shipment, events) {
  const timeline = [];
  
  // Add pickup event
  timeline.push({
    status: 'picked_up',
    title: 'Package Picked Up',
    description: `Package picked up from ${shipment.pickupAddress}`,
    timestamp: shipment.pickupDate,
    completed: true
  });

  // Add transit events
  const transitEvents = events.filter(e => e.status === 'in_transit');
  if (transitEvents.length > 0) {
    timeline.push({
      status: 'in_transit',
      title: 'In Transit',
      description: `Package is on its way to ${shipment.deliveryAddress}`,
      timestamp: transitEvents[0].timestamp,
      completed: shipment.status !== 'pending' && shipment.status !== 'picked_up'
    });
  }

  // Add out for delivery event
  const outForDeliveryEvents = events.filter(e => e.status === 'out_for_delivery');
  if (outForDeliveryEvents.length > 0) {
    timeline.push({
      status: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Package is out for delivery',
      timestamp: outForDeliveryEvents[0].timestamp,
      completed: shipment.status === 'delivered'
    });
  }

  // Add delivery event
  if (shipment.actualDelivery) {
    timeline.push({
      status: 'delivered',
      title: 'Delivered',
      description: `Package delivered to ${shipment.deliveryAddress}`,
      timestamp: shipment.actualDelivery,
      completed: true
    });
  } else {
    timeline.push({
      status: 'delivered',
      title: 'Expected Delivery',
      description: `Expected delivery by ${new Date(shipment.estimatedDelivery).toLocaleDateString()}`,
      timestamp: shipment.estimatedDelivery,
      completed: false
    });
  }

  return timeline;
}

