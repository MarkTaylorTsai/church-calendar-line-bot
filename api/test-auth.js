// Test authentication endpoint
import { validateCronApiKey } from '../middleware/auth.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is supported'
      });
    }

    // Test cron API key authentication
    return validateCronApiKey(req, res, async () => {
      return res.status(200).json({
        success: true,
        message: 'Authentication successful!',
        headers: {
          'x-api-key': req.headers['x-api-key'],
          'api_key': req.query.api_key,
          'content-type': req.headers['content-type']
        },
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
