// Reminder scheduling endpoints
import { ReminderService } from '../services/ReminderService.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { validateCronApiKey } from '../middleware/auth.js';

const reminderService = new ReminderService();

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is supported for reminders'
      });
    }

    return validateCronApiKey(req, res, async () => {
      const { type } = req.query;
      
      switch (type) {
        case 'monthly':
          return await sendMonthlyOverview(req, res);
        case 'weekly':
          return await sendWeeklyReminders(req, res);
        case 'daily':
          return await sendDailyReminders(req, res);
        default:
          return res.status(400).json({
            error: 'Invalid reminder type',
            message: 'Type must be one of: monthly, weekly, daily',
            code: 'INVALID_REMINDER_TYPE'
          });
      }
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function sendMonthlyOverview(req, res) {
  try {
    const result = await reminderService.sendMonthlyOverview();
    
    return res.status(200).json({
      success: true,
      message: 'Monthly overview sent successfully',
      data: result
    });
  } catch (error) {
    if (error.message === 'No activities found for this month') {
      return res.status(200).json({
        success: true,
        message: 'No activities found for this month',
        data: null
      });
    }
    throw error;
  }
}

async function sendWeeklyReminders(req, res) {
  try {
    const result = await reminderService.sendWeeklyReminders();
    
    return res.status(200).json({
      success: true,
      message: 'Weekly reminders sent successfully',
      data: result
    });
  } catch (error) {
    if (error.message === 'No activities found for next week') {
      return res.status(200).json({
        success: true,
        message: 'No activities found for next week',
        data: null
      });
    }
    throw error;
  }
}

async function sendDailyReminders(req, res) {
  try {
    const result = await reminderService.sendDailyReminders();
    
    return res.status(200).json({
      success: true,
      message: 'Daily reminders sent successfully',
      data: result
    });
  } catch (error) {
    if (error.message === 'No activities found for tomorrow') {
      return res.status(200).json({
        success: true,
        message: 'No activities found for tomorrow',
        data: null
      });
    }
    throw error;
  }
}
