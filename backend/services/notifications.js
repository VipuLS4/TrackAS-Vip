import fetch from 'node-fetch';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.twilioSmsNumber = process.env.TWILIO_SMS_NUMBER;
  }

  async sendSMS(to, message) {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        logger.warn('Twilio credentials not configured, skipping SMS');
        return { success: false, error: 'Twilio not configured' };
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.twilioSmsNumber,
          To: to,
          Body: message
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        logger.info(`SMS sent to ${to}`, { messageId: data.sid });
        return { success: true, messageId: data.sid };
      } else {
        logger.error('SMS sending failed', { error: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      logger.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWhatsApp(to, message) {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        logger.warn('Twilio credentials not configured, skipping WhatsApp');
        return { success: false, error: 'Twilio not configured' };
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${this.twilioWhatsAppNumber}`,
          To: `whatsapp:${to}`,
          Body: message
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        logger.info(`WhatsApp sent to ${to}`, { messageId: data.sid });
        return { success: true, messageId: data.sid };
      } else {
        logger.error('WhatsApp sending failed', { error: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      logger.error('WhatsApp sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEmail(to, subject, message) {
    try {
      // For now, just log the email (in production, integrate with SendGrid, AWS SES, etc.)
      logger.info(`Email would be sent to ${to}`, { subject, message });
      return { success: true, messageId: 'logged' };
    } catch (error) {
      logger.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyShipmentCreated(shipment) {
    const message = `New shipment created!\n\nRoute: ${shipment.pickup} → ${shipment.destination}\nCustomer: ${shipment.customer_name}\nCost: ₹${shipment.cost}\n\nTrack at: ${process.env.FRONTEND_URL}/track/${shipment.id}`;
    
    // Notify customer
    if (shipment.customer_phone) {
      await this.sendSMS(shipment.customer_phone, message);
    }
    
    // Notify company
    logger.info('Shipment created notification sent', { shipmentId: shipment.id });
  }

  async notifyShipmentAssigned(shipment, operator) {
    const message = `Shipment assigned to you!\n\nRoute: ${shipment.pickup} → ${shipment.destination}\nCustomer: ${shipment.customer_name}\nCost: ₹${shipment.cost}\n\nPlease accept the shipment in your dashboard.`;
    
    // Notify driver
    if (operator.mobile) {
      await this.sendSMS(operator.mobile, message);
    }
    
    // Notify customer
    if (shipment.customer_phone) {
      const customerMessage = `Your shipment has been assigned to driver ${operator.name} (${operator.mobile}). Track at: ${process.env.FRONTEND_URL}/track/${shipment.id}`;
      await this.sendSMS(shipment.customer_phone, customerMessage);
    }
    
    logger.info('Shipment assignment notification sent', { shipmentId: shipment.id, operatorId: operator.id });
  }

  async notifyShipmentStatusUpdate(shipment, status) {
    const statusMessages = {
      'PICKUP': 'Your shipment has been picked up and is ready for transit.',
      'IN_TRANSIT': 'Your shipment is now in transit and on its way to the destination.',
      'DELIVERED': 'Your shipment has been successfully delivered!'
    };

    const message = `${statusMessages[status] || `Your shipment status has been updated to ${status}`}\n\nRoute: ${shipment.pickup} → ${shipment.destination}\nTrack at: ${process.env.FRONTEND_URL}/track/${shipment.id}`;
    
    // Notify customer
    if (shipment.customer_phone) {
      await this.sendSMS(shipment.customer_phone, message);
    }
    
    logger.info('Shipment status notification sent', { shipmentId: shipment.id, status });
  }

  async notifyDriverPayout(payout) {
    const message = `Payout released!\n\nAmount: ₹${payout.amount}\nRoute: ${payout.pickup} → ${payout.destination}\n\nThe amount will be credited to your registered bank account within 2-3 business days.`;
    
    // This would need operator phone number from payout data
    logger.info('Driver payout notification', { payoutId: payout.id, amount: payout.amount });
  }
}

export default new NotificationService();