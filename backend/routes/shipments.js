import express from 'express';
import { query } from '../db.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from './_authMiddleware.js';
import { validateShipment, validateRequest } from '../utils/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Create shipment with proper validation
router.post('/', requireAuth('COMPANY'), validateShipment, validateRequest, async (req, res) => {
  try {
    const { pickup, destination, length, width, height, weight, instructions, customer_name, customer_phone, customer_email, cost } = req.body;
    
    // Get company ID from authenticated user
    const companyResult = await query('SELECT id FROM companies WHERE user_id = $1', [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company_id = companyResult.rows[0].id;
    const id = uuidv4();
    const commission_pct = parseFloat(process.env.DEFAULT_COMMISSION || '5');
    const commission_amount = Math.round(cost * commission_pct / 100);
    
    await query(`
      INSERT INTO shipments(id, company_id, pickup, destination, length, width, height, weight, instructions, customer_name, customer_phone, customer_email, cost, commission_amount, status) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'CREATED')
    `, [id, company_id, pickup, destination, length, width, height, weight, instructions, customer_name, customer_phone, customer_email, cost, commission_amount]);
    
    logger.info(`Shipment created: ${id}`, { company_id, cost, commission_amount });
    
    res.json({ 
      success: true, 
      shipment_id: id, 
      commission: commission_amount 
    });
  } catch (error) {
    logger.error('Shipment creation error:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});
// Assign driver to shipment
router.post('/:id/assign', requireAuth('ADMIN'), async (req, res) => {
  try {
    const { operator_id } = req.body;
    const { id } = req.params;
    
    await query('UPDATE shipments SET operator_id=$1, status=$2 WHERE id=$3', [operator_id, 'ASSIGNED', id]);
    
    logger.info(`Shipment assigned: ${id}`, { operator_id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Shipment assignment error:', error);
    res.status(500).json({ error: 'Failed to assign shipment' });
  }
});

// Driver accept shipment
router.post('/:id/accept', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get operator ID
    const opResult = await query('SELECT id FROM operators WHERE user_id = $1', [req.user.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    const operator_id = opResult.rows[0].id;
    await query('UPDATE shipments SET operator_id=$1, status=$2 WHERE id=$3', [operator_id, 'ASSIGNED', id]);
    
    logger.info(`Shipment accepted: ${id}`, { operator_id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Shipment acceptance error:', error);
    res.status(500).json({ error: 'Failed to accept shipment' });
  }
});

// Update shipment status
router.post('/:id/status', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    const validStatuses = ['PICKUP', 'IN_TRANSIT', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await query('UPDATE shipments SET status=$1 WHERE id=$2', [status, id]);
    
    logger.info(`Shipment status updated: ${id}`, { status });
    res.json({ success: true });
  } catch (error) {
    logger.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add location ping
router.post('/:id/ping', requireAuth('OPERATOR'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const { id } = req.params;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // Get operator ID
    const opResult = await query('SELECT id FROM operators WHERE user_id = $1', [req.user.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    const operator_id = opResult.rows[0].id;
    await query('INSERT INTO pings(shipment_id, operator_id, lat, lng) VALUES($1, $2, $3, $4)', [id, operator_id, lat, lng]);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Ping error:', error);
    res.status(500).json({ error: 'Failed to add ping' });
  }
});

// Upload proof of delivery
router.post('/:id/pod', requireAuth('OPERATOR'), upload.single('pod'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    await query('INSERT INTO proof_of_delivery(shipment_id, path) VALUES($1, $2)', [id, file.path]);
    await query("UPDATE shipments SET status='DELIVERED' WHERE id=$1", [id]);
    
    logger.info(`POD uploaded: ${id}`, { file: file.path });
    res.json({ success: true });
  } catch (error) {
    logger.error('POD upload error:', error);
    res.status(500).json({ error: 'Failed to upload POD' });
  }
});
router.get('/company/:companyId/enriched', async (req,res)=>{ const companyId=req.params.companyId; const shipmentsQ=`SELECT s.*, op.id as operator_id, op.name as operator_name, op.mobile as operator_mobile, (SELECT reg_no FROM vehicles v WHERE v.company_id = s.company_id LIMIT 1) as vehicle_reg_no, lp.lat as last_lat, lp.lng as last_lng, lp.ts as last_ping_at FROM shipments s LEFT JOIN operators op ON s.operator_id = op.id LEFT JOIN LATERAL ( SELECT lat,lng,ts FROM pings p WHERE p.shipment_id = s.id ORDER BY ts DESC LIMIT 1 ) lp ON true WHERE s.company_id=$1 ORDER BY s.created_at DESC`; const { rows } = await query(shipmentsQ,[companyId]); res.json(rows); });
router.get('/:id/stream', async (req,res)=>{ const id=req.params.id; res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'}); const interval=setInterval(()=>res.write(': ping\n\n'),25000); let lastTs=null; const timer=setInterval(async ()=>{ try{ const r=await query('SELECT lat,lng,ts FROM pings WHERE shipment_id=$1 ORDER BY ts DESC LIMIT 1',[id]); if (r.rows.length){ const p=r.rows[0]; const t=p.ts.toISOString(); if (t!==lastTs){ lastTs=t; const payload=JSON.stringify({lat:p.lat,lng:p.lng,ts:t}); res.write(`data: ${payload}\n\n`); } } }catch(e){console.error(e);} },3000); req.on('close',()=>{ clearInterval(interval); clearInterval(timer); }); });
export default router;
