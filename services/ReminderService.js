// Reminder business logic
import { ActivityService } from './ActivityService.js';
import { LineService } from './LineService.js';
import { GroupService } from './GroupService.js';
import { formatActivityMessage, getCurrentMonthAndYear } from '../lib/utils.js';

export class ReminderService {
  constructor() {
    this.activityService = new ActivityService();
    this.lineService = new LineService();
    
    // Initialize GroupService with error handling
    try {
      this.groupService = new GroupService();
    } catch (error) {
      console.error('Error initializing GroupService:', error);
      this.groupService = null;
    }
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
      
      // Send to groups (from activities with line_group_id)
      const groupResults = await this.sendToGroupsFromActivities(activities, message);
      
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
      const activities = await this.activityService.getActivitiesForThisWeek();
      
      if (activities.length === 0) {
        throw new Error('No activities found for this week');
      }
      
      const message = formatActivityMessage(activities, 'weekly');
      
      // Send to individual users (broadcast)
      const broadcastResult = await this.lineService.sendBroadcastMessage(message);
      
      // Send to groups (from activities with line_group_id)
      const groupResults = await this.sendToGroupsFromActivities(activities, message);
      
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
      const activities = await this.activityService.getActivitiesForToday();
      
      if (activities.length === 0) {
        throw new Error('No activities found for today');
      }
      
      const message = formatActivityMessage(activities, 'daily');
      
      // Send to individual users (broadcast)
      let broadcastResult = null;
      try {
        broadcastResult = await this.lineService.sendBroadcastMessage(message);
      } catch (error) {
        console.error('Error sending broadcast message:', error);
        if (error.response?.status === 429 && error.response?.data?.message?.includes('monthly limit')) {
          console.error('Monthly limit reached for LINE API. Cannot send broadcast message.');
          broadcastResult = { error: 'Monthly limit reached - cannot send broadcast message' };
        } else {
          throw error;
        }
      }
      
      // Send to groups (from activities with line_group_id)
      const groupResults = await this.sendToGroupsFromActivities(activities, message);
      
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
      
      // Send to groups (from activities with line_group_id)
      const groupResults = await this.sendToGroupsFromActivities(activities, message);
      
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

  async sendToGroupsFromActivities(activities, message) {
    try {
      // Check if GroupService is available
      if (!this.groupService) {
        console.log('GroupService not available, skipping group reminders');
        return [];
      }
      
      // Get all active groups from database
      const groups = await this.groupService.getAllActiveGroups();
      
      if (groups.length === 0) {
        console.log('No groups found in database');
        return [];
      }
      
      const results = [];
      
      for (const group of groups) {
        try {
          console.log(`Sending reminder to group: ${group.line_group_id}`);
          const result = await this.lineService.sendMessage(group.line_group_id, message);
          results.push({
            success: true,
            groupId: group.line_group_id,
            groupName: group.group_name,
            result: result
          });
          
          // Add delay between group messages to avoid rate limiting
          if (groups.indexOf(group) < groups.length - 1) {
            console.log('Waiting 1 second before sending to next group...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error sending message to group ${group.line_group_id}:`, error);
          
          // Check if it's a monthly limit error
          if (error.response?.status === 429 && error.response?.data?.message?.includes('monthly limit')) {
            console.error('Monthly limit reached for LINE API. Stopping group message sending.');
            results.push({
              success: false,
              groupId: group.line_group_id,
              groupName: group.group_name,
              error: 'Monthly limit reached - cannot send more messages this month'
            });
            break; // Stop sending to remaining groups
          }
          
          results.push({
            success: false,
            groupId: group.line_group_id,
            groupName: group.group_name,
            error: error.message
          });
          
          // If rate limited, wait longer before continuing
          if (error.response?.status === 429) {
            console.log('Rate limited, waiting 5 seconds before continuing...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      console.log(`Sent reminders to ${results.filter(r => r.success).length}/${groups.length} groups`);
      return results;
    } catch (error) {
      console.error('Error in sendToGroupsFromActivities:', error);
      // Don't throw error - just log it and return empty results
      // This prevents the entire cron job from failing if group service has issues
      console.log('Continuing with broadcast-only reminders due to group service error');
      return [];
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
