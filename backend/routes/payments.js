import express from 'express';
import { query } from '../db.js';
import { requireAuth } from './_authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Create payment intent
router.post('/create', requireAuth('COMPANY'), async (req, res) => {
  try {
    const { shipment_id, amount } = req.body;
    
    // Verify shipment belongs to company
    const shipmentResult = await query(`
      SELECT s.*, c.user_id as company_user_id 
      FROM shipments s 
      JOIN companies c ON s.company_id = c.id 
      WHERE s.id = $1 AND c.user_id = $2
    `, [shipment_id, req.user.id]);
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const pid = 'pay_' + Math.random().toString(36).slice(2, 8);
    await query('INSERT INTO payments(id, shipment_id, amount, status) VALUES($1, $2, $3, $4)', [pid, shipment_id, amount, 'CREATED']);
    
    logger.info(`Payment created: ${pid}`, { shipment_id, amount });
    res.json({ success: true, payment_id: pid });
  } catch (error) {
    logger.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Process payment (simulate payment gateway)
router.post('/process', requireAuth('COMPANY'), async (req, res) => {
  try {
    const { payment_id, payment_method } = req.body;
    
    // Simulate payment processing
    const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [payment_id]);
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const payment = paymentResult.rows[0];
    
    // Simulate payment success (in real implementation, integrate with Razorpay/Stripe)
    await query('UPDATE payments SET status = $1, payment_method = $2 WHERE id = $3', 
      ['COMPLETED', payment_method, payment_id]);
    
    // Update shipment status to paid
    await query('UPDATE shipments SET status = $1 WHERE id = $2', ['ASSIGNED', payment.shipment_id]);
    
    logger.info(`Payment processed: ${payment_id}`, { payment_method });
    res.json({ success: true, status: 'COMPLETED' });
  } catch (error) {
    logger.error('Payment processing error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get payment history
router.get('/history', requireAuth('COMPANY'), async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, s.pickup, s.destination, s.cost
      FROM payments p
      JOIN shipments s ON p.shipment_id = s.id
      JOIN companies c ON s.company_id = c.id
      WHERE c.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Process payout to driver
router.post('/payout', requireAuth('ADMIN'), async (req, res) => {
  try {
    const { shipment_id } = req.body;
    
    const shipmentResult = await query(`
      SELECT s.*, o.id as operator_id, s.cost - s.commission_amount as payout_amount
      FROM shipments s
      JOIN operators o ON s.operator_id = o.id
      WHERE s.id = $1 AND s.status = 'DELIVERED'
    `, [shipment_id]);
    
    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found or not delivered' });
    }
    
    const shipment = shipmentResult.rows[0];
    
    // Create payout record
    await query(`
      INSERT INTO payouts(shipment_id, operator_id, amount, status) 
      VALUES($1, $2, $3, 'PENDING')
    `, [shipment_id, shipment.operator_id, shipment.payout_amount]);
    
    logger.info(`Payout created: ${shipment_id}`, { operator_id: shipment.operator_id, amount: shipment.payout_amount });
    res.json({ success: true });
  } catch (error) {
    logger.error('Payout error:', error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
});

// Webhook for payment gateway (placeholder)
router.post('/webhook', async (req, res) => {
  try {
    logger.info('Payment webhook received:', req.body);
    
    // In real implementation, verify webhook signature
    // Process payment status update
    // Update shipment status accordingly
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
