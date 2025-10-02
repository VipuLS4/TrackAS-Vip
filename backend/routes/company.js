import express from 'express';
import { requireAuth } from './_authMiddleware.js';
import { query } from '../db.js';
const router = express.Router();

router.get('/me', requireAuth('COMPANY'), async (req,res)=>{
  const r = await query('SELECT id, name, email FROM companies WHERE user_id=$1', [req.user.id]);
  res.json(r.rows[0] || {});
});

router.get('/profile', requireAuth('COMPANY'), async (req,res)=>{
  try {
    const r = await query(`
      SELECT c.*, u.email as user_email 
      FROM companies c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.user_id = $1
    `, [req.user.id]);
    res.json(r.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/vehicles', requireAuth('COMPANY'), async (req,res)=>{
  const { type, reg_no, capacity_weight, capacity_volume } = req.body;
  const r = await query('INSERT INTO vehicles(company_id,type,reg_no,capacity_weight,capacity_volume,status) SELECT c.id,$1,$2,$3,$4,\'PENDING\' FROM companies c WHERE c.user_id=$5 RETURNING *',
    [type, reg_no, capacity_weight, capacity_volume, req.user.id]);
  res.json(r.rows[0]);
});

router.post('/shipments', requireAuth('COMPANY'), async (req,res)=>{
  const s = req.body;
  // Insert shipment
  const ins = await query('INSERT INTO shipments(company_id,title,urgency,goods_description,weight,length,width,height,volume,handling_flags,goods_value,status,shipment_cost,payment_mode) SELECT c.id,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,\'CREATED\',$11,$12 FROM companies c WHERE c.user_id=$13 RETURNING id',
    [s.title||null, s.urgency||'NORMAL', s.goods_description||'', s.weight||0, s.length||0, s.width||0, s.height||0, s.volume||0, s.handling_flags||[], s.goods_value||0, s.shipment_cost||0, s.payment_mode||'online', req.user.id])
  const shipmentId = ins.rows[0].id
  // Pickup stop
  await query('INSERT INTO stops(shipment_id,kind,address,lat,lng,contact_name,contact_phone,contact_email,order_index) VALUES($1,\'PICKUP\',$2,$3,$4,$5,$6,$7,0)',
    [shipmentId, s.pickup.address, s.pickup.lat, s.pickup.lng, s.pickup.contact_name, s.pickup.contact_phone, s.pickup.contact_email])
  // Drop stops
  for (let i=0;i<(s.drops||[]).length;i++) {
    const d = s.drops[i];
    await query('INSERT INTO stops(shipment_id,kind,address,lat,lng,contact_name,contact_phone,contact_email,order_index) VALUES($1,\'DROP\',$2,$3,$4,$5,$6,$7,$8)',
      [shipmentId, d.address, d.lat, d.lng, d.contact_name, d.contact_phone, d.contact_email, i+1])
  }
  // Create payment record
  const settings = (await query('SELECT key,value FROM settings')).rows;
  const map = Object.fromEntries(settings.map(x=>[x.key,x.value]));
  const enabled = (map['COMMISSION_ENABLED'] ?? 'true') === 'true';
  const rate = Number(map['COMMISSION_RATE'] ?? 2);
  const mode = map['COMMISSION_MODE'] ?? 'postpaid';
  const commission_amount = enabled ? (Number(s.shipment_cost||0) * rate / 100) : 0;
  const net_payout = Number(s.shipment_cost||0) - commission_amount;
  await query('INSERT INTO payments(shipment_id,company_id,payment_mode,shipment_cost,commission_rate,commission_amount,net_payout,commission_status,payout_status) SELECT $1,c.id,$2,$3,$4,$5,$6,$7,$8 FROM companies c WHERE c.user_id=$9',
    [shipmentId, s.payment_mode||'online', s.shipment_cost||0, rate, commission_amount, net_payout, mode==='prepaid'?'deducted':'pending','pending', req.user.id]);
  res.json({ id: shipmentId });
});

router.get('/shipments', requireAuth('COMPANY'), async (req,res)=>{
  const r = await query('SELECT s.*, p.commission_amount, p.net_payout FROM shipments s JOIN companies c ON s.company_id=c.id LEFT JOIN payments p ON p.shipment_id=s.id WHERE c.user_id=$1 ORDER BY s.created_at DESC', [req.user.id]);
  res.json(r.rows);
});

export default router;
