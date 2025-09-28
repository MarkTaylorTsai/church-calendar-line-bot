// Request validation middleware
import { validateActivityData, validateActivityUpdateData, validateId, validateReminderType } from '../lib/validators.js';

export function validateActivityRequest(req, res, next) {
  const errors = validateActivityData(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', '),
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
}

export function validateActivityUpdateRequest(req, res, next) {
  const errors = validateActivityUpdateData(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', '),
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
}

export function validateActivityId(req, res, next) {
  const { id } = req.query;
  const errors = validateId(id);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', '),
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
}

export function validateReminderRequest(req, res, next) {
  const { type } = req.query;
  const errors = validateReminderType(type);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', '),
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
}

export function validateWebhookRequest(req, res, next) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST method is supported for webhook',
      code: 'METHOD_NOT_ALLOWED'
    });
  }
  
  if (!req.headers['x-line-signature']) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing LINE signature header',
      code: 'MISSING_SIGNATURE'
    });
  }
  
  next();
}

export function validateJsonRequest(req, res, next) {
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Content-Type',
      message: 'Content-Type must be application/json',
      code: 'INVALID_CONTENT_TYPE'
    });
  }
  
  next();
}

export function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    next();
  };
}

export function validateQueryParams(requiredParams) {
  return (req, res, next) => {
    const missingParams = [];
    
    for (const param of requiredParams) {
      if (!req.query[param]) {
        missingParams.push(param);
      }
    }
    
    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Missing required query parameters: ${missingParams.join(', ')}`,
        code: 'MISSING_REQUIRED_PARAMS'
      });
    }
    
    next();
  };
}
