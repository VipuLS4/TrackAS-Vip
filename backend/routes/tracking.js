import express from 'express';
import { query } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Public tracking endpoint - no authentication required
router.get('/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Get shipment details with driver and company info
    const shipmentResult = await query(`
      SELECT 
        s.id,
        s.pickup,
        s.destination,
        s.status,
        s.customer_name,
        s.customer_phone,
        s.customer_email,
        s.cost,
        s.instructions,
        s.created_at,
        s.length,
        s.width,
        s.height,
        s.weight,
        op.name as driver_name,
        op.mobile as driver_mobile,
        v.reg_no as vehicle_reg,
        v.type as vehicle_type,
        c.name as company_name,
        c.email as company_email
      FROM shipments s
      LEFT JOIN operators op ON s.operator_id = op.id
      LEFT JOIN vehicles v ON v.company_id = s.company_id
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE s.id = $1
    `, [shipmentId]);
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const shipment = shipmentResult.rows[0];
    
    // Get latest location ping
    const pingResult = await query(`
      SELECT lat, lng, ts
      FROM pings 
      WHERE shipment_id = $1 
      ORDER BY ts DESC 
      LIMIT 1
    `, [shipmentId]);
    
    // Get status timeline
    const timeline = [
      { status: 'CREATED', timestamp: shipment.created_at, description: 'Shipment created' }
    ];
    
    if (shipment.status === 'ASSIGNED' || shipment.status === 'PICKUP' || shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED') {
      timeline.push({ status: 'ASSIGNED', timestamp: shipment.created_at, description: 'Driver assigned' });
    }
    
    if (shipment.status === 'PICKUP' || shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED') {
      timeline.push({ status: 'PICKUP', timestamp: shipment.created_at, description: 'Picked up' });
    }
    
    if (shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED') {
      timeline.push({ status: 'IN_TRANSIT', timestamp: shipment.created_at, description: 'In transit' });
    }
    
    if (shipment.status === 'DELIVERED') {
      timeline.push({ status: 'DELIVERED', timestamp: shipment.created_at, description: 'Delivered' });
    }
    
    const response = {
      shipment: {
        id: shipment.id,
        pickup: shipment.pickup,
        destination: shipment.destination,
        status: shipment.status,
        customer_name: shipment.customer_name,
        customer_phone: shipment.customer_phone,
        customer_email: shipment.customer_email,
        cost: shipment.cost,
        instructions: shipment.instructions,
        dimensions: {
          length: shipment.length,
          width: shipment.width,
          height: shipment.height,
          weight: shipment.weight
        },
        created_at: shipment.created_at
      },
      driver: shipment.driver_name ? {
        name: shipment.driver_name,
        mobile: shipment.driver_mobile,
        vehicle: {
          reg_no: shipment.vehicle_reg,
          type: shipment.vehicle_type
        }
      } : null,
      company: {
        name: shipment.company_name,
        email: shipment.company_email
      },
      location: pingResult.rows.length > 0 ? {
        lat: pingResult.rows[0].lat,
        lng: pingResult.rows[0].lng,
        timestamp: pingResult.rows[0].ts
      } : null,
      timeline
    };
    
    logger.info(`Tracking request for shipment: ${shipmentId}`);
    res.json(response);
  } catch (error) {
    logger.error('Tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get live location updates via SSE
router.get('/:shipmentId/stream', async (req, res) => {
  const { shipmentId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  const interval = setInterval(async () => {
    try {
      const result = await query(`
        SELECT lat, lng, ts
        FROM pings 
        WHERE shipment_id = $1 
        ORDER BY ts DESC 
        LIMIT 1
      `, [shipmentId]);
      
      if (result.rows.length > 0) {
        const ping = result.rows[0];
        const data = JSON.stringify({
          lat: ping.lat,
          lng: ping.lng,
          timestamp: ping.ts
        });
        res.write(`data: ${data}\n\n`);
      }
    } catch (error) {
      logger.error('SSE error:', error);
    }
  }, 5000); // Update every 5 seconds
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;
