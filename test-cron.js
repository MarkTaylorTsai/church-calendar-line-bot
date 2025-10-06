// Simple test script to verify cron job functionality
import { ReminderService } from './services/ReminderService.js';

async function testCronJob() {
  console.log('=== TESTING CRON JOB ===');
  
  try {
    const reminderService = new ReminderService();
    
    console.log('Testing daily reminders...');
    const result = await reminderService.sendDailyReminders();
    console.log('Daily reminders result:', result);
    
    console.log('=== CRON JOB TEST COMPLETED ===');
  } catch (error) {
    console.error('=== CRON JOB TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCronJob();
