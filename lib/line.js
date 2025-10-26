// LINE API integration
import axios from 'axios';
import crypto from 'crypto';

export class LineService {
  constructor() {
    this.accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    this.channelSecret = process.env.LINE_CHANNEL_SECRET;
    this.baseURL = 'https://api.line.me/v2';
    this.timeout = parseInt(process.env.LINE_API_TIMEOUT) || 5000; // 5s instead of 10s
    this.retryAttempts = parseInt(process.env.LINE_RETRY_ATTEMPTS) || 2; // Reduced from 3 to 2
  }

  async sendMessage(userId, message) {
    try {
      const response = await this.makeRequest('POST', '/bot/message/push', {
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }]
      });

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendReplyMessage(replyToken, message) {
    try {
      const response = await this.makeRequest('POST', '/bot/message/reply', {
        replyToken: replyToken,
        messages: [{
          type: 'text',
          text: message
        }]
      });

      return response.data;
    } catch (error) {
      console.error('Error sending reply message:', error);
      throw error;
    }
  }

  async sendBroadcastMessage(message) {
    try {
      const response = await this.makeRequest('POST', '/bot/message/broadcast', {
        messages: [{
          type: 'text',
          text: message
        }]
      });

      return response.data;
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      throw error;
    }
  }

  verifyWebhook(signature, body) {
    try {
      const hash = crypto
        .createHmac('SHA256', this.channelSecret)
        .update(body)
        .digest('base64');
      
      return signature === hash;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  async makeRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: this.timeout
    };

    if (data) {
      config.data = data;
    }

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios(config);
        return response;
      } catch (error) {
        lastError = error;
        
        if (error.response?.status === 429) {
          // Rate limited - check if in webhook context
          const isWebhookContext = process.env.VERCEL_FUNCTION_PATH === 'api/webhook';
          
          if (isWebhookContext && attempt === 1) {
            // Fast-fail on first rate limit in webhook context
            console.log('Rate limited in webhook context, failing immediately to prevent timeout');
            throw error;
          }
          
          // Use shorter delays for webhook context
          const waitTime = Math.min(1000 * attempt, 3000); // Max 3 seconds, linear backoff
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${this.retryAttempts}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
          // Client error - don't retry
          throw error;
        } else {
          // Server error - retry
          console.log(`Request failed, attempt ${attempt}/${this.retryAttempts}:`, error.message);
          if (attempt < this.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    }

    throw lastError;
  }

  async getProfile(userId) {
    try {
      const response = await this.makeRequest('GET', `/bot/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async getGroupSummary(groupId) {
    try {
      const response = await this.makeRequest('GET', `/bot/group/${groupId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error getting group summary:', error);
      throw error;
    }
  }

  async getRoomSummary(roomId) {
    try {
      const response = await this.makeRequest('GET', `/bot/room/${roomId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error getting room summary:', error);
      throw error;
    }
  }
}
