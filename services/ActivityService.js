// Activity business logic
import { DatabaseService } from '../lib/database.js';
import { validateActivityData, validateActivityUpdateData, sanitizeActivityData } from '../lib/validators.js';
import { createValidationError, createNotFoundError } from '../middleware/errorHandler.js';

export class ActivityService {
  constructor() {
    this.db = new DatabaseService();
  }

  async createActivity(data) {
    // Sanitize input data
    const sanitizedData = sanitizeActivityData(data);
    
    // Validate data
    const errors = validateActivityData(sanitizedData);
    if (errors.length > 0) {
      throw createValidationError(errors.join(', '));
    }

    try {
      const activity = await this.db.createActivity(sanitizedData);
      return activity;
    } catch (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw createValidationError('An activity with this name and date already exists');
      }
      throw error;
    }
  }

  async getActivities(filters = {}) {
    try {
      const activities = await this.db.getActivities(filters);
      return activities;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async getActivityById(id) {
    try {
      const activity = await this.db.getActivityById(id);
      return activity;
    } catch (error) {
      if (error.message === 'Activity not found') {
        throw createNotFoundError('Activity not found');
      }
      throw error;
    }
  }

  async updateActivity(id, data) {
    // Sanitize input data
    const sanitizedData = sanitizeActivityData(data);
    
    // Validate data
    const errors = validateActivityUpdateData(sanitizedData);
    if (errors.length > 0) {
      throw createValidationError(errors.join(', '));
    }

    try {
      const activity = await this.db.updateActivity(id, sanitizedData);
      return activity;
    } catch (error) {
      if (error.message === 'Activity not found') {
        throw createNotFoundError('Activity not found');
      }
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw createValidationError('An activity with this name and date already exists');
      }
      throw error;
    }
  }

  async deleteActivity(id) {
    try {
      // Check if activity exists first
      await this.getActivityById(id);
      
      const result = await this.db.deleteActivity(id);
      return result;
    } catch (error) {
      if (error.message === 'Activity not found') {
        throw createNotFoundError('Activity not found');
      }
      throw error;
    }
  }

  async getActivitiesByDateRange(startDate, endDate) {
    try {
      const activities = await this.db.getActivitiesByDateRange(startDate, endDate);
      return activities;
    } catch (error) {
      console.error('Error fetching activities by date range:', error);
      throw error;
    }
  }

  async getActivitiesForMonth(month, year) {
    try {
      const activities = await this.db.getActivities({ month, year });
      return activities;
    } catch (error) {
      console.error('Error fetching activities for month:', error);
      throw error;
    }
  }

  async getActivitiesForThisWeek() {
    try {
      const { startDate, endDate } = this.getThisWeekDateRange();
      const activities = await this.db.getActivitiesByDateRange(startDate, endDate);
      return activities;
    } catch (error) {
      console.error('Error fetching activities for this week:', error);
      throw error;
    }
  }

  async getActivitiesForNextWeek() {
    try {
      const { startDate, endDate } = this.getNextWeekDateRange();
      const activities = await this.db.getActivitiesByDateRange(startDate, endDate);
      return activities;
    } catch (error) {
      console.error('Error fetching activities for next week:', error);
      throw error;
    }
  }

  async getActivitiesForTomorrow() {
    try {
      const { startDate, endDate } = this.getTomorrowDateRange();
      const activities = await this.db.getActivitiesByDateRange(startDate, endDate);
      return activities;
    } catch (error) {
      console.error('Error fetching activities for tomorrow:', error);
      throw error;
    }
  }

  getThisWeekDateRange() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of this week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of this week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);
    
    return { startDate: weekStart, endDate: weekEnd };
  }

  getNextWeekDateRange() {
    const today = new Date();
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + (7 - today.getDay())); // Start of next week (Sunday)
    nextWeekStart.setHours(0, 0, 0, 0);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // End of next week (Saturday)
    nextWeekEnd.setHours(23, 59, 59, 999);
    
    return { startDate: nextWeekStart, endDate: nextWeekEnd };
  }

  getTomorrowDateRange() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDate = new Date(tomorrow);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(tomorrow);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  }

  async searchActivities(query) {
    try {
      // Get all activities and filter by name (case-insensitive)
      const allActivities = await this.db.getActivities();
      const filteredActivities = allActivities.filter(activity =>
        activity.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredActivities;
    } catch (error) {
      console.error('Error searching activities:', error);
      throw error;
    }
  }
}
