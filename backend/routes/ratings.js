import express from 'express';
import { query } from '../db.js';
import { requireAuth } from './_authMiddleware.js';
const router = express.Router();

router.post('/', async (req,res)=>{
  const { shipment_id, stars, comment, to_operator_id, from_role } = req.body;
  if (!shipment_id || !stars) return res.status(400).json({ error:'Missing fields' });
  await query('INSERT INTO ratings(shipment_id,stars,comment,to_operator_id,from_role) VALUES($1,$2,$3,$4,$5)',
    [shipment_id, stars, comment||'', to_operator_id||null, from_role||'CUSTOMER']);
  res.json({ ok:true });
});

router.get('/operator/:id', requireAuth(), async (req,res)=>{
  const r = await query('SELECT * FROM ratings WHERE to_operator_id=$1 ORDER BY created_at DESC', [req.params.id]);
  res.json(r.rows);
});

export default router;
