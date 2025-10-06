// Group management service for tracking groups when bot joins
import { DatabaseService } from '../lib/database.js';

export class GroupService {
  constructor() {
    this.db = new DatabaseService();
  }

  async addGroup(groupId, groupName = null) {
    try {
      console.log(`Adding group ${groupId} to database`);
      
      // Check if group already exists
      const existingGroup = await this.getGroup(groupId);
      if (existingGroup) {
        console.log(`Group ${groupId} already exists in database`);
        return { success: true, message: 'Group already exists' };
      }

      // Add group to database
      const { data, error } = await this.db.client
        .from('groups')
        .insert([
          {
            line_group_id: groupId,
            group_name: groupName,
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error adding group:', error);
        throw error;
      }

      console.log(`Group ${groupId} added successfully`);
      return { success: true, message: 'Group added successfully', data };
    } catch (error) {
      console.error('Error in addGroup:', error);
      throw error;
    }
  }

  async removeGroup(groupId) {
    try {
      console.log(`Removing group ${groupId} from database`);
      
      const { error } = await this.db.client
        .from('groups')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('line_group_id', groupId);

      if (error) {
        console.error('Error removing group:', error);
        throw error;
      }

      console.log(`Group ${groupId} removed successfully`);
      return { success: true, message: 'Group removed successfully' };
    } catch (error) {
      console.error('Error in removeGroup:', error);
      throw error;
    }
  }

  async getGroup(groupId) {
    try {
      const { data, error } = await this.db.client
        .from('groups')
        .select('*')
        .eq('line_group_id', groupId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error getting group:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getGroup:', error);
      throw error;
    }
  }

  async getAllActiveGroups() {
    try {
      const { data, error } = await this.db.client
        .from('groups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting all groups:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllActiveGroups:', error);
      throw error;
    }
  }
}
