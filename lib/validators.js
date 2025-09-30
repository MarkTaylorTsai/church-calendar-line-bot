// Input validation
import { validateDate, isValidActivityName, parseDateString } from './utils.js';

export function validateActivityData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Activity data is required');
    return errors;
  }
  
  // Validate name
  if (!isValidActivityName(data.name)) {
    errors.push('Activity name is required and must be between 1-255 characters');
  }
  
  // Validate date
  if (!data.date) {
    errors.push('Activity date is required');
  } else if (!validateDate(data.date)) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  } else {
    // Check if date is in the past
    const activityDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activityDate < today) {
      errors.push('Activity date cannot be in the past');
    }
  }
  
  // Validate time fields if provided
  if (data.start_time && !validateTime(data.start_time)) {
    errors.push('Invalid start time format. Expected HH:MM:SS or HH:MM');
  }
  
  if (data.end_time && !validateTime(data.end_time)) {
    errors.push('Invalid end time format. Expected HH:MM:SS or HH:MM');
  }
  
  // Validate time logic if both times are provided
  if (data.start_time && data.end_time && validateTime(data.start_time) && validateTime(data.end_time)) {
    if (data.start_time >= data.end_time) {
      errors.push('Start time must be before end time');
    }
  }
  
  return errors;
}

export function validateActivityUpdateData(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Update data is required');
    return errors;
  }
  
  // At least one field must be provided
  if (!data.name && !data.date && data.start_time === undefined && data.end_time === undefined) {
    errors.push('At least one field (name, date, start_time, or end_time) must be provided for update');
  }
  
  // Validate name if provided
  if (data.name !== undefined && !isValidActivityName(data.name)) {
    errors.push('Activity name must be between 1-255 characters');
  }
  
  // Validate date if provided
  if (data.date !== undefined) {
    if (!validateDate(data.date)) {
      errors.push('Invalid date format. Expected YYYY-MM-DD');
    } else {
      // Check if date is in the past
      const activityDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (activityDate < today) {
        errors.push('Activity date cannot be in the past');
      }
    }
  }
  
  // Validate time fields if provided
  if (data.start_time !== undefined && data.start_time && !validateTime(data.start_time)) {
    errors.push('Invalid start time format. Expected HH:MM:SS or HH:MM');
  }
  
  if (data.end_time !== undefined && data.end_time && !validateTime(data.end_time)) {
    errors.push('Invalid end time format. Expected HH:MM:SS or HH:MM');
  }
  
  return errors;
}

export function validateId(id) {
  const errors = [];
  
  if (!id) {
    errors.push('ID is required');
  } else if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
    errors.push('ID must be a positive integer');
  }
  
  return errors;
}

export function validateReminderType(type) {
  const validTypes = ['monthly', 'weekly', 'daily'];
  
  if (!type) {
    return ['Reminder type is required'];
  }
  
  if (!validTypes.includes(type)) {
    return [`Invalid reminder type. Must be one of: ${validTypes.join(', ')}`];
  }
  
  return [];
}

export function validateLineWebhook(body) {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Webhook body is required');
    return errors;
  }
  
  if (!body.events || !Array.isArray(body.events)) {
    errors.push('Webhook events array is required');
  }
  
  return errors;
}

export function validateLineMessage(message) {
  const errors = [];
  
  if (!message || typeof message !== 'string') {
    errors.push('Message is required and must be a string');
  } else if (message.length > 5000) {
    errors.push('Message is too long (max 5000 characters)');
  } else if (message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  return errors;
}

export function validateUserId(userId) {
  const errors = [];
  
  if (!userId || typeof userId !== 'string') {
    errors.push('User ID is required and must be a string');
  } else if (userId.length < 1 || userId.length > 100) {
    errors.push('User ID must be between 1-100 characters');
  }
  
  return errors;
}

export function validateDateRange(startDate, endDate) {
  const errors = [];
  
  if (!startDate || !endDate) {
    errors.push('Both start date and end date are required');
    return errors;
  }
  
  if (!validateDate(startDate)) {
    errors.push('Invalid start date format. Expected YYYY-MM-DD');
  }
  
  if (!validateDate(endDate)) {
    errors.push('Invalid end date format. Expected YYYY-MM-DD');
  }
  
  if (errors.length === 0) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
  }
  
  return errors;
}

export function validateTime(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return false;
  }
  
  // Accept HH:MM:SS or HH:MM format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(timeString);
}

export function sanitizeActivityData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = {};
  
  if (data.name) {
    sanitized.name = data.name.trim().substring(0, 255);
  }
  
  if (data.date) {
    sanitized.date = data.date.trim();
  }
  
  if (data.start_time) {
    sanitized.start_time = data.start_time.trim();
  }
  
  if (data.end_time) {
    sanitized.end_time = data.end_time.trim();
  }
  
  return sanitized;
}
