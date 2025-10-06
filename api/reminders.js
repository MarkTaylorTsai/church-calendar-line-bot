// Reminder scheduling endpoints
import { ReminderService } from '../services/ReminderService.js';
import { DatabaseService } from '../lib/database.js';
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
        case 'cleanup':
          return await performCleanup(req, res);
        default:
          return res.status(400).json({
            error: 'Invalid reminder type',
            message: 'Type must be one of: monthly, weekly, daily, cleanup',
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

async function performCleanup(req, res) {
  try {
    console.log('=== CLEANUP START ===');
    console.log('Starting automatic cleanup of old activities...');
    
    // Initialize database service
    const db = new DatabaseService();
    
    // Clean up activities older than 1 day
    const result = await db.cleanupOldActivities(1);
    
    console.log(`Cleanup completed: ${result.deleted_count} activities deleted`);
    
    if (result.deleted_activities.length > 0) {
      console.log('Deleted activities:');
      result.deleted_activities.forEach(activity => {
        console.log(`- ID: ${activity.id}, Name: ${activity.name}, Date: ${activity.date}`);
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted_count: result.deleted_count,
      cutoff_date: result.cutoff_date,
      deleted_activities: result.deleted_activities
    });
  } catch (error) {
    console.error('=== CLEANUP ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== CLEANUP ERROR END ===');
    
    return res.status(500).json({
      error: 'Cleanup Error',
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
}
