// Supabase database operations
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class DatabaseService {
  constructor() {
    this.client = supabase;
  }

  async getActivities(filters = {}) {
    try {
      let query = this.client
        .from('activities')
        .select('*')
        .order('date', { ascending: true });

      // Apply filters
      if (filters.month && filters.year) {
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0);
        
        query = query
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async createActivity(data) {
    try {
      const { data: activity, error } = await this.client
        .from('activities')
        .insert([{
          name: data.name,
          date: data.date,
          start_time: data.start_time || null,
          end_time: data.end_time || null
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create activity: ${error.message}`);
      }

      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async updateActivity(id, data) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      // Only update fields that are provided
      if (data.name !== undefined) updateData.name = data.name;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;

      const { data: activity, error } = await this.client
        .from('activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Activity not found');
        }
        throw new Error(`Failed to update activity: ${error.message}`);
      }

      return activity;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  async deleteActivity(id) {
    try {
      const { error } = await this.client
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete activity: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  async getActivitiesByDateRange(startDate, endDate) {
    try {
      const { data, error } = await this.client
        .from('activities')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching activities by date range:', error);
      throw error;
    }
  }

  async getActivityById(id) {
    try {
      const { data, error } = await this.client
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Activity not found');
        }
        throw new Error(`Database query failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching activity by ID:', error);
      throw error;
    }
  }

  async cleanupOldActivities(daysOld = 1) {
    try {
      // Calculate cutoff date
      const now = new Date();
      const taipeiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
      const cutoffDate = new Date(taipeiTime);
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      cutoffDate.setHours(0, 0, 0, 0);

      console.log('Cleaning up activities older than:', cutoffDate.toISOString().split('T')[0]);

      // First, get the activities that will be deleted for logging
      const { data: oldActivities, error: fetchError } = await this.client
        .from('activities')
        .select('id, name, date')
        .lt('date', cutoffDate.toISOString().split('T')[0]);

      if (fetchError) {
        throw new Error(`Failed to fetch old activities: ${fetchError.message}`);
      }

      if (!oldActivities || oldActivities.length === 0) {
        return { deleted_count: 0, deleted_activities: [] };
      }

      // Delete the old activities
      const { error: deleteError } = await this.client
        .from('activities')
        .delete()
        .lt('date', cutoffDate.toISOString().split('T')[0]);

      if (deleteError) {
        throw new Error(`Failed to delete old activities: ${deleteError.message}`);
      }

      return {
        deleted_count: oldActivities.length,
        deleted_activities: oldActivities,
        cutoff_date: cutoffDate.toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error cleaning up old activities:', error);
      throw error;
    }
  }
}
