import express from 'express';
import { query } from '../db.js';
import { requireAuth } from './_authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get operator profile
router.get('/profile', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, u.email as user_email 
      FROM operators o 
      JOIN users u ON o.user_id = u.id 
      WHERE o.user_id = $1
    `, [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get available shipments for driver
router.get('/shipments/available', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, c.name as company_name, c.email as company_email
      FROM shipments s
      JOIN companies c ON s.company_id = c.id
      WHERE s.status = 'CREATED' AND s.operator_id IS NULL
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    logger.error('Available shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Get driver's assigned shipments
router.get('/shipments', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const opResult = await query('SELECT id FROM operators WHERE user_id = $1', [req.user.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    const operator_id = opResult.rows[0].id;
    const result = await query(`
      SELECT s.*, c.name as company_name, c.email as company_email
      FROM shipments s
      JOIN companies c ON s.company_id = c.id
      WHERE s.operator_id = $1
      ORDER BY s.created_at DESC
    `, [operator_id]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Driver shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Update operator online status
router.post('/status', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const { online } = req.body;
    await query('UPDATE operators SET online = $1 WHERE user_id = $2', [online, req.user.id]);
    
    logger.info(`Operator status updated: ${req.user.id}`, { online });
    res.json({ success: true });
  } catch (error) {
    logger.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add location ping
router.post('/ping', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const { lat, lng, shipment_id } = req.body || {};
    if (typeof lat !== 'number' || typeof lng !== 'number' || !shipment_id) {
      return res.status(400).json({ error: 'lat, lng, shipment_id required' });
    }
    
    const op = await query('SELECT id FROM operators WHERE user_id=$1', [req.user.id]);
    const opId = (op.rows && op.rows[0] && op.rows[0].id) || null;
    if (!opId) return res.status(400).json({ error: 'Operator not found' });
    
    await query('INSERT INTO pings (shipment_id, operator_id, lat, lng) VALUES ($1,$2,$3,$4)', [shipment_id, opId, lat, lng]);
    
    logger.info(`Location ping added: ${shipment_id}`, { lat, lng });
    res.json({ success: true });
  } catch (error) {
    logger.error('Ping error:', error);
    res.status(500).json({ error: 'Failed to add ping' });
  }
});

export default router;