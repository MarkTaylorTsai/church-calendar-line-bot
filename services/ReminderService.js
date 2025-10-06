// Reminder business logic
import { ActivityService } from './ActivityService.js';
import { LineService } from './LineService.js';
import { GroupService } from './GroupService.js';
import { formatActivityMessage, getCurrentMonthAndYear } from '../lib/utils.js';

export class ReminderService {
  constructor() {
    this.activityService = new ActivityService();
    this.lineService = new LineService();
    this.groupService = new GroupService();
  }

  async sendMonthlyOverview() {
    try {
      const { month, year } = getCurrentMonthAndYear();
      const activities = await this.activityService.getActivitiesForMonth(month, year);
      
      if (activities.length === 0) {
        throw new Error('No activities found for this month');
      }
      
      const message = formatActivityMessage(activities, 'monthly');
      
      // Send to individual users (broadcast)
      const broadcastResult = await this.lineService.sendBroadcastMessage(message);
      
      // Send to groups
      const groupResults = await this.sendToGroups(message);
      
      console.log(`Monthly overview sent successfully. ${activities.length} activities found.`);
      return {
        success: true,
        activitiesCount: activities.length,
        message: message,
        broadcastResult: broadcastResult,
        groupResults: groupResults
      };
    } catch (error) {
      console.error('Error sending monthly overview:', error);
      throw error;
    }
  }

  async sendWeeklyReminders() {
    try {
      const activities = await this.activityService.getActivitiesForNextWeek();
      
      if (activities.length === 0) {
        throw new Error('No activities found for next week');
      }
      
      const message = formatActivityMessage(activities, 'weekly');
      
      // Send to individual users (broadcast)
      const broadcastResult = await this.lineService.sendBroadcastMessage(message);
      
      // Send to groups
      const groupResults = await this.sendToGroups(message);
      
      console.log(`Weekly reminders sent successfully. ${activities.length} activities found.`);
      return {
        success: true,
        activitiesCount: activities.length,
        message: message,
        broadcastResult: broadcastResult,
        groupResults: groupResults
      };
    } catch (error) {
      console.error('Error sending weekly reminders:', error);
      throw error;
    }
  }

  async sendDailyReminders() {
    try {
      const activities = await this.activityService.getActivitiesForTomorrow();
      
      if (activities.length === 0) {
        throw new Error('No activities found for tomorrow');
      }
      
      const message = formatActivityMessage(activities, 'daily');
      
      // Send to individual users (broadcast)
      const broadcastResult = await this.lineService.sendBroadcastMessage(message);
      
      // Send to groups
      const groupResults = await this.sendToGroups(message);
      
      console.log(`Daily reminders sent successfully. ${activities.length} activities found.`);
      return {
        success: true,
        activitiesCount: activities.length,
        message: message,
        broadcastResult: broadcastResult,
        groupResults: groupResults
      };
    } catch (error) {
      console.error('Error sending daily reminders:', error);
      throw error;
    }
  }

  async sendCustomReminder(activities, messageType = 'custom') {
    try {
      if (!activities || activities.length === 0) {
        throw new Error('No activities provided for reminder');
      }
      
      const message = formatActivityMessage(activities, messageType);
      
      // Send to individual users (broadcast)
      const broadcastResult = await this.lineService.sendBroadcastMessage(message);
      
      // Send to groups
      const groupResults = await this.sendToGroups(message);
      
      console.log(`Custom reminder sent successfully. ${activities.length} activities found.`);
      return {
        success: true,
        activitiesCount: activities.length,
        message: message,
        broadcastResult: broadcastResult,
        groupResults: groupResults
      };
    } catch (error) {
      console.error('Error sending custom reminder:', error);
      throw error;
    }
  }

  async sendToGroups(message) {
    try {
      const groups = await this.groupService.getAllActiveGroups();
      const results = [];
      
      for (const group of groups) {
        try {
          console.log(`Sending reminder to group: ${group.group_id}`);
          const result = await this.lineService.sendMessage(group.group_id, message);
          results.push({
            success: true,
            groupId: group.group_id,
            groupName: group.group_name,
            result: result
          });
        } catch (error) {
          console.error(`Error sending message to group ${group.group_id}:`, error);
          results.push({
            success: false,
            groupId: group.group_id,
            groupName: group.group_name,
            error: error.message
          });
        }
      }
      
      console.log(`Sent reminders to ${results.filter(r => r.success).length}/${groups.length} groups`);
      return results;
    } catch (error) {
      console.error('Error in sendToGroups:', error);
      throw error;
    }
  }

  async sendReminderToUser(userId, activities, messageType = 'custom') {
    try {
      if (!activities || activities.length === 0) {
        throw new Error('No activities provided for reminder');
      }
      
      const message = formatActivityMessage(activities, messageType);
      const result = await this.lineService.sendMessage(userId, message);
      
      console.log(`Reminder sent to user ${userId} successfully. ${activities.length} activities found.`);
      return {
        success: true,
        userId: userId,
        activitiesCount: activities.length,
        message: message,
        result: result
      };
    } catch (error) {
      console.error('Error sending reminder to user:', error);
      throw error;
    }
  }

  async getUpcomingActivities(days = 7) {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);
      
      const activities = await this.activityService.getActivitiesByDateRange(today, futureDate);
      return activities;
    } catch (error) {
      console.error('Error getting upcoming activities:', error);
      throw error;
    }
  }

  async getActivitiesForDateRange(startDate, endDate) {
    try {
      const activities = await this.activityService.getActivitiesByDateRange(startDate, endDate);
      return activities;
    } catch (error) {
      console.error('Error getting activities for date range:', error);
      throw error;
    }
  }

  async testReminderSystem() {
    try {
      console.log('Testing reminder system...');
      
      // Test monthly overview
      try {
        await this.sendMonthlyOverview();
        console.log('✓ Monthly overview test passed');
      } catch (error) {
        console.log('✗ Monthly overview test failed:', error.message);
      }
      
      // Test weekly reminders
      try {
        await this.sendWeeklyReminders();
        console.log('✓ Weekly reminders test passed');
      } catch (error) {
        console.log('✗ Weekly reminders test failed:', error.message);
      }
      
      // Test daily reminders
      try {
        await this.sendDailyReminders();
        console.log('✓ Daily reminders test passed');
      } catch (error) {
        console.log('✗ Daily reminders test failed:', error.message);
      }
      
      return { success: true, message: 'Reminder system test completed' };
    } catch (error) {
      console.error('Error testing reminder system:', error);
      throw error;
    }
  }
}
