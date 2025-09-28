// Activity CRUD operations
import { ActivityService } from '../services/ActivityService.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { requireAuth, logAccessAttempt } from '../middleware/auth.js';

const activityService = new ActivityService();

export default async function handler(req, res) {
  try {
    // Apply authentication middleware
    return requireAuth(req, res, async () => {
      switch (req.method) {
        case 'GET':
          return await getActivities(req, res);
        case 'POST':
          return await createActivity(req, res);
        case 'PUT':
          return await updateActivity(req, res);
        case 'DELETE':
          return await deleteActivity(req, res);
        default:
          return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET, POST, PUT, DELETE methods are supported'
          });
      }
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getActivities(req, res) {
  const { month, year } = req.query;
  const filters = {};
  
  if (month) filters.month = parseInt(month);
  if (year) filters.year = parseInt(year);
  
  const activities = await activityService.getActivities(filters);
  
  logAccessAttempt(req, 'GET_ACTIVITIES', true);
  
  return res.status(200).json({
    success: true,
    data: activities,
    count: activities.length
  });
}

async function createActivity(req, res) {
  const { name, date } = req.body;
  
  if (!name || !date) {
    logAccessAttempt(req, 'CREATE_ACTIVITY', false);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name and date are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  const activity = await activityService.createActivity({ name, date });
  
  logAccessAttempt(req, 'CREATE_ACTIVITY', true);
  
  return res.status(201).json({
    success: true,
    data: activity,
    message: 'Activity created successfully'
  });
}

async function updateActivity(req, res) {
  const { id } = req.query;
  
  if (!id) {
    logAccessAttempt(req, 'UPDATE_ACTIVITY', false);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Activity ID is required',
      code: 'MISSING_ACTIVITY_ID'
    });
  }
  
  const { name, date } = req.body;
  const updateData = {};
  
  if (name !== undefined) updateData.name = name;
  if (date !== undefined) updateData.date = date;
  
  if (Object.keys(updateData).length === 0) {
    logAccessAttempt(req, 'UPDATE_ACTIVITY', false);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one field (name or date) must be provided for update',
      code: 'NO_UPDATE_FIELDS'
    });
  }
  
  const activity = await activityService.updateActivity(parseInt(id), updateData);
  
  logAccessAttempt(req, 'UPDATE_ACTIVITY', true);
  
  return res.status(200).json({
    success: true,
    data: activity,
    message: 'Activity updated successfully'
  });
}

async function deleteActivity(req, res) {
  const { id } = req.query;
  
  if (!id) {
    logAccessAttempt(req, 'DELETE_ACTIVITY', false);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Activity ID is required',
      code: 'MISSING_ACTIVITY_ID'
    });
  }
  
  await activityService.deleteActivity(parseInt(id));
  
  logAccessAttempt(req, 'DELETE_ACTIVITY', true);
  
  return res.status(200).json({
    success: true,
    message: 'Activity deleted successfully'
  });
}
