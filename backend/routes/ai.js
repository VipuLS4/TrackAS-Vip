import express from 'express';
import { query } from '../db.js';
import { requireAuth } from './_authMiddleware.js';
import aiBotService from '../services/ai_bot.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Chat with AI assistant
router.post('/chat', requireAuth(), async (req, res) => {
  try {
    const { message, shipmentId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let context = {};
    
    // If shipment ID provided, get context
    if (shipmentId) {
      context = await aiBotService.getShipmentContext(shipmentId);
    }

    const response = await aiBotService.generateResponse(message, context);
    
    logger.info('AI chat request', { 
      userId: req.user.id, 
      messageLength: message.length,
      hasShipmentContext: !!shipmentId
    });
    
    res.json({ 
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Get route optimization
router.post('/optimize-route', requireAuth(), async (req, res) => {
  try {
    const { pickup, destination } = req.body;
    
    if (!pickup || !destination) {
      return res.status(400).json({ error: 'Pickup and destination are required' });
    }

    const optimization = await aiBotService.getRouteOptimization(pickup, destination);
    
    res.json({
      success: true,
      ...optimization
    });
  } catch (error) {
    logger.error('Route optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize route' });
  }
});

// Get delivery estimate
router.post('/delivery-estimate', requireAuth(), async (req, res) => {
  try {
    const { route, weight, urgency } = req.body;
    
    if (!route || !weight) {
      return res.status(400).json({ error: 'Route and weight are required' });
    }

    const estimate = await aiBotService.getDeliveryEstimate(route, weight, urgency);
    
    res.json({
      success: true,
      ...estimate
    });
  } catch (error) {
    logger.error('Delivery estimate error:', error);
    res.status(500).json({ error: 'Failed to calculate delivery estimate' });
  }
});

// Get AI suggestions for shipment
router.post('/shipment-suggestions', requireAuth('COMPANY'), async (req, res) => {
  try {
    const { pickup, destination, weight, dimensions } = req.body;
    
    const suggestions = await aiBotService.generateResponse(
      `I'm creating a shipment from ${pickup} to ${destination}. Weight: ${weight}kg, Dimensions: ${JSON.stringify(dimensions)}. What suggestions do you have?`,
      { type: 'shipment_creation', pickup, destination, weight, dimensions }
    );
    
    res.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Shipment suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Twilio webhook for WhatsApp/SMS
router.post('/twilio-webhook', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const from = req.body.From || req.body.from;
    const body = req.body.Body || req.body.body || '';
    
    if (!from || !body) {
      return res.send('<Response></Response>');
    }

    const reply = await aiBotService.generateResponse(body, { source: 'twilio', from });
    
    // Try WhatsApp first, fallback to SMS
    try {
      const notificationService = (await import('../services/notifications.js')).default;
      await notificationService.sendWhatsApp(from.replace('whatsapp:', '').replace('+', ''), reply);
    } catch (e) {
      const notificationService = (await import('../services/notifications.js')).default;
      await notificationService.sendSMS(from.replace('+', ''), reply);
    }
    
    res.send('<Response></Response>');
  } catch (error) {
    logger.error('Twilio webhook error:', error);
    res.send('<Response></Response>');
  }
});

export default router;