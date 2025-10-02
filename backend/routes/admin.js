import express from 'express';
import { query } from '../db.js';
import { requireAuth } from './_authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get pending approvals
router.get('/pending', requireAuth('ADMIN'), async (req, res) => {
  try {
    const companies = (await query("SELECT * FROM companies WHERE status='PENDING'")).rows;
    const operators = (await query("SELECT * FROM operators WHERE status='PENDING'")).rows;
    const vehicles = (await query("SELECT * FROM vehicles WHERE status='PENDING'")).rows;
    res.json({ companies, operators, vehicles });
  } catch (error) {
    logger.error('Pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// Approve/reject entities
router.post('/approve', requireAuth('ADMIN'), async (req, res) => {
  try {
    const { type, id, action } = req.body;
    const table = (type === 'company') ? 'companies' : (type === 'operator' ? 'operators' : 'vehicles');
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    
    await query(`UPDATE ${table} SET status=$1 WHERE id=$2`, [status, id]);
    
    logger.info(`${type} ${action}d: ${id}`);
    res.json({ success: true, status });
  } catch (error) {
    logger.error('Approval error:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

// Get commission settings
router.get('/commission', requireAuth('ADMIN'), async (req, res) => {
  try {
    const r = await query("SELECT value FROM app_settings WHERE key='commission_pct' LIMIT 1");
    res.json({ commission: r.rows[0] ? parseFloat(r.rows[0].value) : 5 });
  } catch (error) {
    logger.error('Commission fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch commission' });
  }
});

// Update commission settings
router.post('/commission', requireAuth('ADMIN'), async (req, res) => {
  try {
    const { commission } = req.body;
    if (commission < 0 || commission > 10) {
      return res.status(400).json({ error: 'Commission must be between 0 and 10' });
    }
    
    await query("INSERT INTO app_settings(key,value) VALUES('commission_pct',$1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", [commission]);
    
    logger.info(`Commission updated: ${commission}%`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Commission update error:', error);
    res.status(500).json({ error: 'Failed to update commission' });
  }
});

// Get all payouts
router.get('/payouts', requireAuth('ADMIN'), async (req, res) => {
  try {
    const r = (await query(`
      SELECT p.*, s.pickup, s.destination, o.name as operator_name, o.mobile as operator_mobile
      FROM payouts p
      JOIN shipments s ON p.shipment_id = s.id
      JOIN operators o ON p.operator_id = o.id
      ORDER BY p.created_at DESC
    `)).rows;
    res.json(r);
  } catch (error) {
    logger.error('Payouts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Release payout
router.post('/payouts/:id/release', requireAuth('ADMIN'), async (req, res) => {
  try {
    const id = req.params.id;
    await query("UPDATE payouts SET status='RELEASED', released_at=now() WHERE id=$1", [id]);
    
    logger.info(`Payout released: ${id}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Payout release error:', error);
    res.status(500).json({ error: 'Failed to release payout' });
  }
});

// Get dashboard statistics
router.get('/stats', requireAuth('ADMIN'), async (req, res) => {
  try {
    const stats = {};
    
    // Total counts
    stats.totalCompanies = (await query("SELECT COUNT(*) FROM companies")).rows[0].count;
    stats.totalOperators = (await query("SELECT COUNT(*) FROM operators")).rows[0].count;
    stats.totalShipments = (await query("SELECT COUNT(*) FROM shipments")).rows[0].count;
    stats.totalVehicles = (await query("SELECT COUNT(*) FROM vehicles")).rows[0].count;
    
    // Pending counts
    stats.pendingCompanies = (await query("SELECT COUNT(*) FROM companies WHERE status='PENDING'")).rows[0].count;
    stats.pendingOperators = (await query("SELECT COUNT(*) FROM operators WHERE status='PENDING'")).rows[0].count;
    stats.pendingVehicles = (await query("SELECT COUNT(*) FROM vehicles WHERE status='PENDING'")).rows[0].count;
    
    // Revenue stats
    stats.totalRevenue = (await query("SELECT SUM(commission_amount) FROM shipments")).rows[0].sum || 0;
    stats.pendingPayouts = (await query("SELECT SUM(amount) FROM payouts WHERE status='PENDING'")).rows[0].sum || 0;
    
    // Recent activity
    stats.recentShipments = (await query(`
      SELECT s.*, c.name as company_name, o.name as operator_name
      FROM shipments s
      LEFT JOIN companies c ON s.company_id = c.id
      LEFT JOIN operators o ON s.operator_id = o.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `)).rows;
    
    res.json(stats);
  } catch (error) {
    logger.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all shipments for admin
router.get('/shipments', requireAuth('ADMIN'), async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, c.name as company_name, o.name as operator_name, o.mobile as operator_mobile
      FROM shipments s
      LEFT JOIN companies c ON s.company_id = c.id
      LEFT JOIN operators o ON s.operator_id = o.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    logger.error('Admin shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

export default router;
