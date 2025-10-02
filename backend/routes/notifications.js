import express from 'express';
import { requireAuth } from './_authMiddleware.js';
import { sendWhatsApp, sendSMS, sendEmail } from '../services/notifications.js';
const router = express.Router();

router.post('/send', requireAuth('ADMIN'), async (req,res)=>{
  const { channel, to, message, subject } = req.body;
  let r;
  if (channel==='whatsapp') r = await sendWhatsApp(to, message);
  else if (channel==='sms') r = await sendSMS(to, message);
  else r = await sendEmail(to, subject||'TrackAS', message);
  res.json(r);
});

export default router;
