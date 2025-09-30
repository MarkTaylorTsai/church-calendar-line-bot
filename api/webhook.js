// LINE webhook handler
import { LineService } from '../services/LineService.js';
import { ActivityService } from '../services/ActivityService.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { isAuthorizedUser, logAccessAttempt } from '../middleware/auth.js';

const lineService = new LineService();
const activityService = new ActivityService();

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST method is supported for webhook'
      });
    }
    
    // Verify LINE webhook signature
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing LINE signature header',
        code: 'MISSING_SIGNATURE'
      });
    }
    
    const isValid = lineService.verifyWebhook(signature, JSON.stringify(req.body));
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid LINE signature',
        code: 'INVALID_SIGNATURE'
      });
    }
    
    // Handle LINE webhook events
    return await handleLineWebhook(req, res);
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function handleLineWebhook(req, res) {
  const events = req.body.events;
  
  if (!events || events.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No events to process'
    });
  }
  
  for (const event of events) {
    try {
      await processEvent(event);
    } catch (error) {
      console.error('Error processing event:', error);
      // Continue processing other events even if one fails
    }
  }
  
  return res.status(200).json({
    success: true,
    message: 'Webhook events processed'
  });
}

async function processEvent(event) {
  switch (event.type) {
    case 'message':
      await handleMessageEvent(event);
      break;
    case 'follow':
      await handleFollowEvent(event);
      break;
    case 'unfollow':
      await handleUnfollowEvent(event);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
}

async function handleMessageEvent(event) {
  const message = event.message;
  const userId = event.source.userId;
  
  // Check if user is authorized for CRUD operations
  const isAuthorized = isAuthorizedUser(userId);
  
  if (message.type === 'text') {
    const userMessage = message.text.toLowerCase().trim();
    
    // Handle different commands
    if (userMessage === 'help' || userMessage === '幫助') {
      await lineService.sendMessage(userId, getHelpMessage(isAuthorized));
      logAccessAttempt({ body: { source: { userId } } }, 'HELP_COMMAND', true);
    } else if (userMessage === 'list' || userMessage === '列表' || userMessage === '查看 全部') {
      await handleViewAllActivities(userId);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_ALL_ACTIVITIES', true);
    } else if (userMessage === '查看 這個月' || userMessage === '查看 本月') {
      await handleViewMonthlyActivities(userId);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_MONTHLY_ACTIVITIES', true);
    } else if (userMessage === '查看 這個禮拜' || userMessage === '查看 本週') {
      await handleViewWeeklyActivities(userId);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_WEEKLY_ACTIVITIES', true);
    } else if (userMessage === '查看 下周' || userMessage === '查看 下個禮拜') {
      await handleViewNextWeekActivities(userId);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_NEXT_WEEK_ACTIVITIES', true);
    } else if (userMessage === '查看 下個月') {
      await handleViewNextMonthActivities(userId);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_NEXT_MONTH_ACTIVITIES', true);
    } else if (userMessage === '查看 id' || userMessage === '查看 ID') {
      await handleViewAllActivities(userId);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_ALL_ACTIVITIES', true);
    } else if (userMessage.startsWith('查看 ') && (userMessage.includes('月') || userMessage.includes('Month'))) {
      await handleViewSpecificMonthActivities(userId, userMessage);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_SPECIFIC_MONTH_ACTIVITIES', true);
    } else if (userMessage.startsWith('add') || userMessage.startsWith('create') || userMessage.startsWith('新增')) {
      if (isAuthorized) {
        await handleCreateActivity(userId, userMessage);
        logAccessAttempt({ body: { source: { userId } } }, 'CREATE_COMMAND', true);
      } else {
        await lineService.sendMessage(userId, 'Sorry, you are not authorized to create activities. Contact the administrator.');
        logAccessAttempt({ body: { source: { userId } } }, 'CREATE_COMMAND', false);
      }
    } else if (userMessage.startsWith('更新 ')) {
      if (isAuthorized) {
        await handleUpdateActivity(userId, userMessage);
        logAccessAttempt({ body: { source: { userId } } }, 'UPDATE_COMMAND', true);
      } else {
        await lineService.sendMessage(userId, 'Sorry, you are not authorized to update activities. Contact the administrator.');
        logAccessAttempt({ body: { source: { userId } } }, 'UPDATE_COMMAND', false);
      }
    } else if (userMessage.startsWith('刪除 ')) {
      if (isAuthorized) {
        await handleDeleteActivity(userId, userMessage);
        logAccessAttempt({ body: { source: { userId } } }, 'DELETE_COMMAND', true);
      } else {
        await lineService.sendMessage(userId, 'Sorry, you are not authorized to delete activities. Contact the administrator.');
        logAccessAttempt({ body: { source: { userId } } }, 'DELETE_COMMAND', false);
      }
    } else {
      await lineService.sendMessage(userId, 'Sorry, I don\'t understand that command. Type "help" for available commands.');
      logAccessAttempt({ body: { source: { userId } } }, 'UNKNOWN_COMMAND', false);
    }
  }
}

async function handleFollowEvent(event) {
  const userId = event.source.userId;
  const welcomeMessage = `歡迎使用教會行事曆機器人！\n\n我可以幫您：\n• 管理教會活動\n• 發送提醒通知\n\n輸入 "help" 查看可用指令。`;
  
  await lineService.sendMessage(userId, welcomeMessage);
}

async function handleUnfollowEvent(event) {
  // Log unfollow event for analytics
  console.log('User unfollowed:', event.source.userId);
}

async function handleViewAllActivities(userId) {
  try {
    const activities = await activityService.getActivities();
    await lineService.sendActivityList(userId, activities, '所有活動');
  } catch (error) {
    console.error('Error fetching all activities:', error);
    await lineService.sendErrorMessage(userId, '無法取得活動列表，請稍後再試。');
  }
}


async function handleViewMonthlyActivities(userId) {
  try {
    const { month, year } = getCurrentMonthAndYear();
    const activities = await activityService.getActivitiesForMonth(month, year);
    await lineService.sendActivityList(userId, activities, '本月活動');
  } catch (error) {
    console.error('Error fetching monthly activities:', error);
    await lineService.sendErrorMessage(userId, '無法取得本月活動，請稍後再試。');
  }
}

async function handleViewWeeklyActivities(userId) {
  try {
    const activities = await activityService.getActivitiesForThisWeek();
    await lineService.sendActivityList(userId, activities, '本週活動');
  } catch (error) {
    console.error('Error fetching weekly activities:', error);
    await lineService.sendErrorMessage(userId, '無法取得本週活動，請稍後再試。');
  }
}

async function handleViewNextWeekActivities(userId) {
  try {
    const activities = await activityService.getActivitiesForNextWeek();
    await lineService.sendActivityList(userId, activities, '下周活動');
  } catch (error) {
    console.error('Error fetching next week activities:', error);
    await lineService.sendErrorMessage(userId, '無法取得下周活動，請稍後再試。');
  }
}

async function handleViewNextMonthActivities(userId) {
  try {
    const { month, year } = getNextMonthAndYear();
    const activities = await activityService.getActivitiesForMonth(month, year);
    await lineService.sendActivityList(userId, activities, '下個月活動');
  } catch (error) {
    console.error('Error fetching next month activities:', error);
    await lineService.sendErrorMessage(userId, '無法取得下個月活動，請稍後再試。');
  }
}

async function handleViewSpecificMonthActivities(userId, userMessage) {
  try {
    const { month, year } = parseMonthFromMessage(userMessage);
    const activities = await activityService.getActivitiesForMonth(month, year);
    const monthName = getMonthName(month);
    await lineService.sendActivityList(userId, activities, `${year}年${monthName}活動`);
  } catch (error) {
    if (error.message === 'Invalid month format') {
      await lineService.sendMessage(userId, '月份格式錯誤。請使用：查看 11月 或 查看 十一月');
    } else {
      console.error('Error fetching specific month activities:', error);
      await lineService.sendErrorMessage(userId, '無法取得指定月份活動，請稍後再試。');
    }
  }
}


async function handleUpdateActivity(userId, userMessage) {
  try {
    // Parse command: "更新 id 日期/名稱"
    const parts = userMessage.split(' ');
    if (parts.length < 3) {
      await lineService.sendMessage(userId, '格式錯誤。請使用：更新 [ID] [日期/名稱]\n例如：更新 1 2025-10-15 或 更新 1 新的活動名稱');
      return;
    }

    const activityId = parseInt(parts[1]);
    const updateValue = parts.slice(2).join(' ');

    // Determine if it's a date or name update
    let updateData = {};
    if (isValidDate(updateValue)) {
      updateData.date = updateValue;
    } else {
      updateData.name = updateValue;
    }

    const updatedActivity = await activityService.updateActivity(activityId, updateData);
    await lineService.sendSuccessMessage(userId, `活動已成功更新：\n${formatActivityForDisplay(updatedActivity)}`);
  } catch (error) {
    if (error.message === 'Activity not found') {
      await lineService.sendMessage(userId, '找不到指定的活動。');
    } else {
      console.error('Error updating activity:', error);
      await lineService.sendErrorMessage(userId, '更新活動時發生錯誤，請稍後再試。');
    }
  }
}

async function handleCreateActivity(userId, userMessage) {
  try {
    // Parse command: "新增 日期 [時間] 活動名稱"
    // Support formats: "新增 2025-01-15 主日崇拜" or "新增 2025-01-15 09:00-11:00 主日崇拜"
    const parts = userMessage.split(' ');
    if (parts.length < 3) {
      await lineService.sendMessage(userId, '格式錯誤。請使用：\n• 新增 [日期] [活動名稱]\n• 新增 [日期] [開始時間-結束時間] [活動名稱]\n例如：新增 2025-01-15 主日崇拜\n例如：新增 2025-01-15 09:00-11:00 主日崇拜');
      return;
    }

    const date = parts[1];
    let activityName, startTime, endTime;

    // Check if the third part contains time (HH:MM-HH:MM format)
    if (parts[2] && parts[2].includes('-') && parts[2].includes(':')) {
      const timeRange = parts[2];
      const timeParts = timeRange.split('-');
      if (timeParts.length === 2) {
        startTime = timeParts[0];
        endTime = timeParts[1];
        activityName = parts.slice(3).join(' ');
      } else {
        activityName = parts.slice(2).join(' ');
      }
    } else {
      activityName = parts.slice(2).join(' ');
    }

    // Validate date format
    if (!isValidDate(date)) {
      await lineService.sendMessage(userId, '日期格式錯誤。請使用 YYYY-MM-DD 格式，例如：2025-01-15');
      return;
    }

    // Validate time format if provided
    if (startTime && !isValidTime(startTime)) {
      await lineService.sendMessage(userId, '開始時間格式錯誤。請使用 HH:MM 格式，例如：09:00');
      return;
    }

    if (endTime && !isValidTime(endTime)) {
      await lineService.sendMessage(userId, '結束時間格式錯誤。請使用 HH:MM 格式，例如：11:00');
      return;
    }

    // Create the activity
    const activityData = {
      name: activityName,
      date: date
    };

    if (startTime) activityData.start_time = startTime;
    if (endTime) activityData.end_time = endTime;

    const newActivity = await activityService.createActivity(activityData);

    await lineService.sendSuccessMessage(userId, `活動已成功新增：\n${formatActivityForDisplay(newActivity)}`);
  } catch (error) {
    if (error.message.includes('validation') || error.message.includes('required')) {
      await lineService.sendMessage(userId, '資料驗證錯誤：' + error.message);
    } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
      await lineService.sendMessage(userId, '此日期和活動名稱已存在，請使用不同的組合。');
    } else {
      console.error('Error creating activity:', error);
      await lineService.sendErrorMessage(userId, '新增活動時發生錯誤，請稍後再試。');
    }
  }
}

async function handleDeleteActivity(userId, userMessage) {
  try {
    // Parse command: "刪除 id"
    const parts = userMessage.split(' ');
    if (parts.length !== 2) {
      await lineService.sendMessage(userId, '格式錯誤。請使用：刪除 [ID]\n例如：刪除 1');
      return;
    }

    const activityId = parseInt(parts[1]);
    
    // Get activity details before deletion for confirmation message
    const activity = await activityService.getActivityById(activityId);
    await activityService.deleteActivity(activityId);
    
    await lineService.sendSuccessMessage(userId, `活動已成功刪除：\n${formatActivityForDisplay(activity)}`);
  } catch (error) {
    if (error.message === 'Activity not found') {
      await lineService.sendMessage(userId, '找不到指定的活動。');
    } else {
      console.error('Error deleting activity:', error);
      await lineService.sendErrorMessage(userId, '刪除活動時發生錯誤，請稍後再試。');
    }
  }
}

function getCurrentMonthAndYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

function getNextMonthAndYear() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    month: nextMonth.getMonth() + 1,
    year: nextMonth.getFullYear()
  };
}

function parseMonthFromMessage(userMessage) {
  // Extract month from messages like "查看 11月", "查看 十一月", "查看 11月 2025"
  const parts = userMessage.split(' ');
  
  if (parts.length < 2) {
    throw new Error('Invalid month format');
  }
  
  const monthText = parts[1];
  const currentYear = new Date().getFullYear();
  let year = currentYear;
  
  // Check if year is specified (e.g., "查看 11月 2025")
  if (parts.length >= 3 && !isNaN(parseInt(parts[2]))) {
    year = parseInt(parts[2]);
  }
  
  // Parse month from various formats
  let month = null;
  
  // Handle numeric format (11月, 1月, etc.)
  if (monthText.match(/^\d+月$/)) {
    month = parseInt(monthText.replace('月', ''));
  }
  // Handle Chinese month names
  else if (monthText.match(/^[一二三四五六七八九十]+月$/)) {
    month = parseChineseMonth(monthText);
  }
  // Handle full Chinese month names
  else if (monthText.match(/^[一二三四五六七八九十]+月$/)) {
    month = parseChineseMonth(monthText);
  }
  // Handle specific Chinese month names (check exact matches first)
  else if (monthText === '十一月') month = 11;
  else if (monthText === '十二月') month = 12;
  else if (monthText === '十月') month = 10;
  else if (monthText === '九月') month = 9;
  else if (monthText === '八月') month = 8;
  else if (monthText === '七月') month = 7;
  else if (monthText === '六月') month = 6;
  else if (monthText === '五月') month = 5;
  else if (monthText === '四月') month = 4;
  else if (monthText === '三月') month = 3;
  else if (monthText === '二月') month = 2;
  else if (monthText === '一月') month = 1;
  
  if (!month || month < 1 || month > 12) {
    throw new Error('Invalid month format');
  }
  
  return { month, year };
}

function parseChineseMonth(monthText) {
  const chineseToNumber = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
    '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12
  };
  
  // Handle special cases for 十月, 十一月, 十二月
  if (monthText === '十月') return 10;
  if (monthText === '十一月') return 11;
  if (monthText === '十二月') return 12;
  
  // Handle other cases
  for (const [chinese, number] of Object.entries(chineseToNumber)) {
    if (monthText.includes(chinese + '月')) {
      return number;
    }
  }
  
  throw new Error('Invalid month format');
}

function getMonthName(month) {
  const monthNames = [
    '', '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];
  return monthNames[month] || '';
}

function isValidDate(dateString) {
  if (!dateString) return false;
  
  // Check if it's a valid date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
}

function isValidTime(timeString) {
  if (!timeString) return false;
  
  // Accept HH:MM or HH:MM:SS format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(timeString);
}

function formatActivityForDisplay(activity) {
  const date = new Date(activity.date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dayOfWeek = days[date.getDay()];
  
  let timeRange = '';
  if (activity.start_time && activity.end_time) {
    const startTime = formatTimeToHHMM(activity.start_time);
    const endTime = formatTimeToHHMM(activity.end_time);
    timeRange = ` ${startTime}-${endTime}`;
  } else if (activity.start_time) {
    timeRange = ` ${formatTimeToHHMM(activity.start_time)}`;
  }
  
  return `• ${month}/${day} ${dayOfWeek}${timeRange} ${activity.name}`;
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

function getHelpMessage(isAuthorized = false) {
  let message = `教會行事曆助理指令：\n\n• help - 顯示此幫助訊息\n• 查看 全部 - 查看所有活動\n• 查看 id - 查看所有活動\n• 查看 這個月 - 查看本月活動\n• 查看 下個月 - 查看下個月活動\n• 查看 這個禮拜 - 查看本週活動\n• 查看 下周 - 查看下周活動\n• 查看 [月份] - 查看指定月份活動\n\n月份格式範例：\n• 查看 11月 - 查看11月活動\n• 查看 十一月 - 查看11月活動\n• 查看 11月 2025 - 查看2025年11月活動`;
  
  if (isAuthorized) {
    message += `\n\n管理員功能：\n• 新增 [日期] [活動名稱] - 新增活動\n• 新增 [日期] [開始時間-結束時間] [活動名稱] - 新增帶時間的活動\n• 更新 [ID] [日期/名稱/時間] - 更新活動\n• 刪除 [ID] - 刪除活動\n\n時間格式範例：\n• 新增 2025-01-15 主日崇拜\n• 新增 2025-01-15 09:00-11:00 主日崇拜`;
  }
  
  message += `\n\n更多功能即將推出！`;
  
  return message;
}
