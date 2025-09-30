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
}
