// Group management service for storing and retrieving group IDs
import { DatabaseService } from '../lib/database.js';

export class GroupService {
  constructor() {
    this.db = new DatabaseService();
  }

  async addGroup(groupId, groupName = null) {
    try {
      console.log(`Adding group ${groupId} to reminder list`);
      
      // Check if group already exists
      const existingGroup = await this.getGroup(groupId);
      if (existingGroup) {
        console.log(`Group ${groupId} already exists in reminder list`);
        return { success: true, message: 'Group already exists' };
      }

      // Add group to database
      const { data, error } = await this.db.supabase
        .from('reminder_groups')
        .insert([
          {
            group_id: groupId,
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
      console.log(`Removing group ${groupId} from reminder list`);
      
      const { error } = await this.db.supabase
        .from('reminder_groups')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('group_id', groupId);

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
      const { data, error } = await this.db.supabase
        .from('reminder_groups')
        .select('*')
        .eq('group_id', groupId)
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
      const { data, error } = await this.db.supabase
        .from('reminder_groups')
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

  async updateGroupName(groupId, groupName) {
    try {
      const { error } = await this.db.supabase
        .from('reminder_groups')
        .update({ 
          group_name: groupName,
          updated_at: new Date().toISOString()
        })
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating group name:', error);
        throw error;
      }

      return { success: true, message: 'Group name updated successfully' };
    } catch (error) {
      console.error('Error in updateGroupName:', error);
      throw error;
    }
  }
}
