// Recipients management service for storing and retrieving recipients (users and groups)
import { DatabaseService } from '../lib/database.js';

export class RecipientsService {
  constructor() {
    this.db = new DatabaseService();
  }

  async addGroupRecipient(groupId) {
    try {
      console.log(`Adding group ${groupId} as recipient`);
      
      // Check if group already exists as recipient
      const existingRecipient = await this.getGroupRecipient(groupId);
      if (existingRecipient) {
        console.log(`Group ${groupId} already exists as recipient`);
        return { success: true, message: 'Group already exists as recipient' };
      }

      // Add group as recipient (no specific activity_id means all activities)
      const { data, error } = await this.db.supabase
        .from('recipients')
        .insert([
          {
            line_group_id: groupId,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error adding group recipient:', error);
        throw error;
      }

      console.log(`Group ${groupId} added as recipient successfully`);
      return { success: true, message: 'Group added as recipient successfully', data };
    } catch (error) {
      console.error('Error in addGroupRecipient:', error);
      throw error;
    }
  }

  async removeGroupRecipient(groupId) {
    try {
      console.log(`Removing group ${groupId} from recipients`);
      
      const { error } = await this.db.supabase
        .from('recipients')
        .delete()
        .eq('line_group_id', groupId);

      if (error) {
        console.error('Error removing group recipient:', error);
        throw error;
      }

      console.log(`Group ${groupId} removed from recipients successfully`);
      return { success: true, message: 'Group removed from recipients successfully' };
    } catch (error) {
      console.error('Error in removeGroupRecipient:', error);
      throw error;
    }
  }

  async addUserRecipient(userId) {
    try {
      console.log(`Adding user ${userId} as recipient`);
      
      // Check if user already exists as recipient
      const existingRecipient = await this.getUserRecipient(userId);
      if (existingRecipient) {
        console.log(`User ${userId} already exists as recipient`);
        return { success: true, message: 'User already exists as recipient' };
      }

      // Add user as recipient (no specific activity_id means all activities)
      const { data, error } = await this.db.supabase
        .from('recipients')
        .insert([
          {
            line_user_id: userId,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error adding user recipient:', error);
        throw error;
      }

      console.log(`User ${userId} added as recipient successfully`);
      return { success: true, message: 'User added as recipient successfully', data };
    } catch (error) {
      console.error('Error in addUserRecipient:', error);
      throw error;
    }
  }

  async removeUserRecipient(userId) {
    try {
      console.log(`Removing user ${userId} from recipients`);
      
      const { error } = await this.db.supabase
        .from('recipients')
        .delete()
        .eq('line_user_id', userId);

      if (error) {
        console.error('Error removing user recipient:', error);
        throw error;
      }

      console.log(`User ${userId} removed from recipients successfully`);
      return { success: true, message: 'User removed from recipients successfully' };
    } catch (error) {
      console.error('Error in removeUserRecipient:', error);
      throw error;
    }
  }

  async getGroupRecipient(groupId) {
    try {
      const { data, error } = await this.db.supabase
        .from('recipients')
        .select('*')
        .eq('line_group_id', groupId)
        .is('activity_id', null) // Global recipient (not tied to specific activity)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error getting group recipient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getGroupRecipient:', error);
      throw error;
    }
  }

  async getUserRecipient(userId) {
    try {
      const { data, error } = await this.db.supabase
        .from('recipients')
        .select('*')
        .eq('line_user_id', userId)
        .is('activity_id', null) // Global recipient (not tied to specific activity)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error getting user recipient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserRecipient:', error);
      throw error;
    }
  }

  async getAllGroupRecipients() {
    try {
      const { data, error } = await this.db.supabase
        .from('recipients')
        .select('*')
        .not('line_group_id', 'is', null)
        .is('activity_id', null) // Global recipients (not tied to specific activity)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting all group recipients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllGroupRecipients:', error);
      throw error;
    }
  }

  async getAllUserRecipients() {
    try {
      const { data, error } = await this.db.supabase
        .from('recipients')
        .select('*')
        .not('line_user_id', 'is', null)
        .is('activity_id', null) // Global recipients (not tied to specific activity)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting all user recipients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUserRecipients:', error);
      throw error;
    }
  }

  async getAllRecipients() {
    try {
      const { data, error } = await this.db.supabase
        .from('recipients')
        .select('*')
        .is('activity_id', null) // Global recipients (not tied to specific activity)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting all recipients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllRecipients:', error);
      throw error;
    }
  }
}
