// Authentication middleware
import { createUnauthorizedError, createError } from './errorHandler.js';

export function validateLineUserId(req, res, next) {
  const lineUserId = req.headers['x-line-user-id'] || req.body?.source?.userId;
  
  if (!lineUserId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'LINE User ID is required',
      code: 'MISSING_USER_ID'
    });
  }
  
  const allowedUsers = process.env.LINE_USER_ID ? process.env.LINE_USER_ID.split(',') : [];
  
  if (allowedUsers.length > 0 && !allowedUsers.includes(lineUserId)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access denied. You are not authorized to perform this action.',
      code: 'ACCESS_DENIED'
    });
  }
  
  // Add user ID to request for use in handlers
  req.userId = lineUserId;
  next();
}

export function validateCronApiKey(req, res, next) {
  // Check multiple possible sources for API key
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.api_key ||
                 req.query['api-key'];
  
  const expectedApiKey = process.env.CRON_API_KEY;
  
  // Debug logging
  console.log('Cron Auth Debug:', {
    method: req.method,
    url: req.url,
    hasApiKey: !!apiKey,
    hasExpectedKey: !!expectedApiKey,
    apiKeySource: apiKey ? 'FOUND' : 'NOT_FOUND',
    headers: Object.keys(req.headers),
    query: Object.keys(req.query)
  });
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key is required for cron jobs',
      code: 'MISSING_API_KEY',
      debug: {
        receivedHeaders: Object.keys(req.headers),
        receivedQuery: Object.keys(req.query),
        expectedKeySet: !!expectedApiKey
      }
    });
  }
  
  if (!expectedApiKey) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Cron API key not configured on server',
      code: 'API_KEY_NOT_CONFIGURED'
    });
  }
  
  if (apiKey !== expectedApiKey) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid API key',
      code: 'INVALID_API_KEY',
      debug: {
        received: apiKey.substring(0, 10) + '...',
        expected: expectedApiKey.substring(0, 10) + '...',
        lengthMatch: apiKey.length === expectedApiKey.length
      }
    });
  }
  
  console.log('Cron authentication successful');
  next();
}

export function validateWebhookSignature(req, res, next) {
  const signature = req.headers['x-line-signature'];
  
  if (!signature) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing LINE signature header',
      code: 'MISSING_SIGNATURE'
    });
  }
  
  // Signature validation will be handled in the webhook handler
  next();
}

export function requireAuth(req, res, next) {
  // Check if request is from cron job (has API key)
  const hasApiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (hasApiKey) {
    // Cron job request - validate API key
    return validateCronApiKey(req, res, next);
  } else {
    // LINE user request - check if it's a GET request
    if (req.method === 'GET') {
      // GET requests are allowed for everyone
      return next();
    } else {
      // POST, PUT, DELETE requests require user authentication
      return validateLineUserId(req, res, next);
    }
  }
}

export function getUserId(req) {
  if (!req) return 'unknown';
  return req.userId || req.body?.source?.userId || req.headers?.['x-line-user-id'] || 'unknown';
}

export function isAuthorizedUser(userId) {
  const allowedUsers = process.env.LINE_USER_ID ? process.env.LINE_USER_ID.split(',') : [];
  
  if (allowedUsers.length === 0) {
    // No restrictions if no users configured
    return true;
  }
  
  return allowedUsers.includes(userId);
}

export function logAccessAttempt(req, action, success = true) {
  const userId = getUserId(req);
  const timestamp = new Date().toISOString();
  const headers = req?.headers || {};
  const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || req?.connection?.remoteAddress || req?.socket?.remoteAddress || 'unknown';
  
  console.log(`[${timestamp}] Access ${success ? 'GRANTED' : 'DENIED'} - User: ${userId}, Action: ${action}, IP: ${ip}`);
}
