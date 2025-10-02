import fetch from 'node-fetch';
import logger from '../utils/logger.js';

class AIBotService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async generateResponse(userMessage, context = {}) {
    try {
      if (!this.openaiApiKey) {
        return this.getFallbackResponse(userMessage);
      }

      const systemPrompt = `You are TrackAS AI Assistant, a helpful logistics and shipment tracking bot. You help users with:

1. Shipment tracking and status updates
2. Logistics questions and guidance
3. General support for the TrackAS platform
4. Route optimization suggestions
5. Delivery time estimates

Current context: ${JSON.stringify(context)}

Be helpful, concise, and professional. If you don't know something specific about TrackAS, say so and offer to help with what you can.`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      logger.info('AI response generated', { userMessage: userMessage.substring(0, 100), responseLength: aiResponse.length });
      return aiResponse;

    } catch (error) {
      logger.error('AI service error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Basic keyword matching for common queries
    if (message.includes('track') || message.includes('shipment')) {
      return "To track your shipment, please visit our tracking page and enter your shipment ID. You can also use the tracking form on our homepage.";
    }
    
    if (message.includes('delivery') || message.includes('time')) {
      return "Delivery times vary based on distance and route. Typically, local deliveries take 1-2 days, while inter-city deliveries take 3-5 days. For specific estimates, please contact our support team.";
    }
    
    if (message.includes('cost') || message.includes('price')) {
      return "Shipment costs are calculated based on weight, dimensions, distance, and urgency. You can get an instant quote by creating a shipment in your company dashboard.";
    }
    
    if (message.includes('driver') || message.includes('operator')) {
      return "Our drivers are verified professionals with valid licenses. You can view driver details and contact information once your shipment is assigned.";
    }
    
    if (message.includes('help') || message.includes('support')) {
      return "I'm here to help! You can ask me about shipment tracking, delivery times, costs, or any other logistics questions. For technical support, please contact our support team.";
    }
    
    if (message.includes('register') || message.includes('signup')) {
      return "To register as a company or driver, visit our registration pages. Companies can create shipments, while drivers can accept available jobs.";
    }
    
    return "I'm TrackAS AI Assistant! I can help you with shipment tracking, delivery information, costs, and general logistics questions. What would you like to know?";
  }

  async getShipmentContext(shipmentId) {
    try {
      // This would typically fetch shipment data from database
      // For now, return basic context
      return {
        shipmentId,
        hasShipment: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching shipment context:', error);
      return { shipmentId, hasShipment: false };
    }
  }

  async getRouteOptimization(pickup, destination) {
    try {
      // This would integrate with Mapbox or Google Maps API
      // For now, return basic suggestions
      return {
        estimatedDistance: "Calculating...",
        estimatedTime: "Calculating...",
        suggestions: [
          "Consider traffic conditions during peak hours",
          "Plan for rest stops on long routes",
          "Check weather conditions before departure"
        ]
      };
    } catch (error) {
      logger.error('Error getting route optimization:', error);
      return {
        estimatedDistance: "Unable to calculate",
        estimatedTime: "Unable to calculate",
        suggestions: ["Please check route manually"]
      };
    }
  }

  async getDeliveryEstimate(route, weight, urgency = 'normal') {
    try {
      // Basic estimation logic
      const baseDays = urgency === 'urgent' ? 1 : 3;
      const weightFactor = weight > 100 ? 1 : 0.5;
      const estimatedDays = Math.ceil(baseDays + weightFactor);
      
      return {
        estimatedDays,
        estimatedDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toLocaleDateString(),
        factors: [
          `Route complexity: ${route}`,
          `Weight: ${weight}kg`,
          `Urgency: ${urgency}`
        ]
      };
    } catch (error) {
      logger.error('Error calculating delivery estimate:', error);
      return {
        estimatedDays: 3,
        estimatedDate: "Unable to calculate",
        factors: ["Please contact support for accurate estimate"]
      };
    }
  }
}

export default new AIBotService();