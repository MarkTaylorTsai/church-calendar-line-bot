// LINE messaging service
import { LineService as LineApiService } from '../lib/line.js';
import { validateLineMessage, validateUserId } from '../lib/validators.js';
import { createValidationError } from '../middleware/errorHandler.js';

export class LineService {
  constructor() {
    this.lineApi = new LineApiService();
  }

  async sendMessage(userId, message) {
    // Validate inputs
    const userIdErrors = validateUserId(userId);
    if (userIdErrors.length > 0) {
      throw createValidationError(userIdErrors.join(', '));
    }

    const messageErrors = validateLineMessage(message);
    if (messageErrors.length > 0) {
      throw createValidationError(messageErrors.join(', '));
    }

    try {
      const result = await this.lineApi.sendMessage(userId, message);
      console.log(`Message sent successfully to user ${userId}`);
      return result;
    } catch (error) {
      console.error('Error sending message to user:', error);
      throw error;
    }
  }

  async sendBroadcastMessage(message) {
    // Validate message
    const messageErrors = validateLineMessage(message);
    if (messageErrors.length > 0) {
      throw createValidationError(messageErrors.join(', '));
    }

    try {
      const result = await this.lineApi.sendBroadcastMessage(message);
      console.log('Broadcast message sent successfully');
      return result;
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      throw error;
    }
  }

  async sendWelcomeMessage(userId) {
    const welcomeMessage = `歡迎使用教會行事曆助理！\n\n我可以幫您：\n• 管理教會活動\n• 發送提醒通知\n\n輸入 "help" 查看可用指令。`;
    
    return await this.sendMessage(userId, welcomeMessage);
  }

  async sendHelpMessage(userId) {
    const helpMessage = `教會行事曆機器人指令：\n\n• help - 顯示此幫助訊息\n• list - 查看活動列表\n\n更多功能即將推出！`;
    
    return await this.sendMessage(userId, helpMessage);
  }

  async sendActivityList(userId, activities, title = '活動列表') {
    if (!activities || activities.length === 0) {
      const message = `目前沒有${title}安排。`;
      return await this.sendMessage(userId, message);
    }

    let message = `${title}：\n`;
    activities.forEach(activity => {
      const date = new Date(activity.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = getDayOfWeek(activity.date);
      
      let timeRange = '';
      if (activity.start_time && activity.end_time) {
        const startTime = formatTimeToHHMM(activity.start_time);
        const endTime = formatTimeToHHMM(activity.end_time);
        timeRange = ` ${startTime}-${endTime}`;
      } else if (activity.start_time) {
        timeRange = ` ${formatTimeToHHMM(activity.start_time)}`;
      }
      
      message += `• ${month}/${day} ${dayOfWeek}${timeRange} ${activity.name}\n`;
    });

    return await this.sendMessage(userId, message.trim());
  }

  async sendActivityDetails(userId, activity) {
    const date = new Date(activity.date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek = days[date.getDay()];
    
    let timeInfo = '';
    if (activity.start_time && activity.end_time) {
      const startTime = formatTimeToHHMM(activity.start_time);
      const endTime = formatTimeToHHMM(activity.end_time);
      timeInfo = `\n時間: ${startTime}-${endTime}`;
    } else if (activity.start_time) {
      timeInfo = `\n時間: ${formatTimeToHHMM(activity.start_time)}`;
    }
    
    const message = `活動詳情：\n\nID: ${activity.id}\n日期: ${month}/${day}/${year} ${dayOfWeek}${timeInfo}\n名稱: ${activity.name}\n建立時間: ${new Date(activity.created_at).toLocaleString('zh-TW')}`;
    
    return await this.sendMessage(userId, message);
  }

  async sendErrorMessage(userId, errorMessage) {
    const message = `抱歉，發生錯誤：\n${errorMessage}\n\n請稍後再試或聯繫管理員。`;
    return await this.sendMessage(userId, message);
  }

  async sendSuccessMessage(userId, successMessage) {
    const message = `✅ ${successMessage}`;
    return await this.sendMessage(userId, message);
  }

  async sendReminderMessage(userId, activities, reminderType) {
    let message = '';
    
    switch (reminderType) {
      case 'monthly':
        message = '📅 本月活動提醒：\n';
        break;
      case 'weekly':
        message = '📢 下週活動提醒：\n';
        break;
      case 'daily':
        message = '⏰ 明天活動提醒：\n';
        break;
      default:
        message = '📋 活動提醒：\n';
    }

    if (activities && activities.length > 0) {
      activities.forEach(activity => {
        const formattedDate = formatDate(activity.date);
        const dayOfWeek = getDayOfWeek(activity.date);
        message += `${formattedDate} ${dayOfWeek} ${activity.name}\n`;
      });
    } else {
      message += '目前沒有活動安排。';
    }

    return await this.sendMessage(userId, message.trim());
  }

  async sendConfirmationMessage(userId, action, details) {
    let message = '';
    
    switch (action) {
      case 'activity_created':
        message = `✅ 活動已成功創建：\n${details}`;
        break;
      case 'activity_updated':
        message = `✅ 活動已成功更新：\n${details}`;
        break;
      case 'activity_deleted':
        message = `✅ 活動已成功刪除：\n${details}`;
        break;
      default:
        message = `✅ 操作成功：\n${details}`;
    }

    return await this.sendMessage(userId, message);
  }

  async sendValidationErrorMessage(userId, errors) {
    const message = `❌ 輸入錯誤：\n${errors.join('\n')}\n\n請檢查您的輸入並重試。`;
    return await this.sendMessage(userId, message);
  }

  async sendNotFoundMessage(userId, resource) {
    const message = `❌ 找不到${resource}。\n\n請檢查輸入或聯繫管理員。`;
    return await this.sendMessage(userId, message);
  }

  async sendSystemErrorMessage(userId) {
    const message = `❌ 系統暫時無法使用。\n\n請稍後再試或聯繫管理員。`;
    return await this.sendMessage(userId, message);
  }

  async sendRateLimitMessage(userId) {
    const message = `⏳ 請求過於頻繁，請稍後再試。`;
    return await this.sendMessage(userId, message);
  }

  async sendMaintenanceMessage(userId) {
    const message = `🔧 系統維護中，請稍後再試。`;
    return await this.sendMessage(userId, message);
  }

  async sendTestMessage(userId) {
    const message = `🧪 測試訊息 - 系統正常運作`;
    return await this.sendMessage(userId, message);
  }

  async verifyWebhook(signature, body) {
    return this.lineApi.verifyWebhook(signature, body);
  }

  async getProfile(userId) {
    try {
      const profile = await this.lineApi.getProfile(userId);
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async getGroupSummary(groupId) {
    try {
      const summary = await this.lineApi.getGroupSummary(groupId);
      return summary;
    } catch (error) {
      console.error('Error getting group summary:', error);
      throw error;
    }
  }

  async getRoomSummary(roomId) {
    try {
      const summary = await this.lineApi.getRoomSummary(roomId);
      return summary;
    } catch (error) {
      console.error('Error getting room summary:', error);
      throw error;
    }
  }
}

// Helper functions for message formatting
function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${month}-${day}-${year}`;
}

function getDayOfWeek(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const days = [
    '星期日', '星期一', '星期二', '星期三', 
    '星期四', '星期五', '星期六'
  ];
  
  return days[d.getDay()];
}

function formatTimeToHHMM(timeString) {
  if (!timeString) return '';
  
  // If already in HH:MM format, return as is
  if (timeString.match(/^\d{1,2}:\d{2}$/)) {
    return timeString;
  }
  
  // If in HH:MM:SS format, remove seconds
  if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
    return timeString.substring(0, 5);
  }
  
  return timeString;
}

function formatActivityMessage(activities, type = 'list') {
  if (!activities || activities.length === 0) {
    return '目前沒有活動安排。';
  }

  let message = '';
  
  switch (type) {
    case 'monthly':
      message = '📅 本月活動：\n';
      break;
    case 'weekly':
      message = '📢 下週活動：\n';
      break;
    case 'daily':
      message = '⏰ 明天活動：\n';
      break;
    default:
      message = '📋 活動列表：\n';
  }

  activities.forEach(activity => {
    const formattedDate = formatDate(activity.date);
    const dayOfWeek = getDayOfWeek(activity.date);
    message += `${formattedDate} ${dayOfWeek} ${activity.name}\n`;
  });

  return message.trim();
}
