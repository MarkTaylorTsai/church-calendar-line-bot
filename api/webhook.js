// LINE webhook handler with enhanced error logging
export default async function handler(req, res) {
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Check environment variables first
    const envCheck = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? 'SET' : 'NOT_SET'
    };
    console.log('Environment variables:', envCheck);
    
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST method is supported for webhook'
      });
    }
    
    // Check for missing environment variables
    const missingEnvVars = [];
    if (!process.env.SUPABASE_URL) missingEnvVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_ANON_KEY) missingEnvVars.push('SUPABASE_ANON_KEY');
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) missingEnvVars.push('LINE_CHANNEL_ACCESS_TOKEN');
    if (!process.env.LINE_CHANNEL_SECRET) missingEnvVars.push('LINE_CHANNEL_SECRET');
    
    if (missingEnvVars.length > 0) {
      console.error('Missing environment variables:', missingEnvVars);
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Missing required environment variables',
        missing: missingEnvVars
      });
    }
    
    // Try to import services with error handling
    let LineService, ActivityService, errorHandler, isAuthorizedUser, logAccessAttempt;
    
    try {
      console.log('Importing LineService...');
      const lineServiceModule = await import('../services/LineService.js');
      LineService = lineServiceModule.LineService;
      console.log('LineService imported successfully');
    } catch (importError) {
      console.error('Error importing LineService:', importError);
      return res.status(500).json({
        error: 'Import Error',
        message: 'Failed to import LineService',
        details: importError.message
      });
    }
    
    try {
      console.log('Importing ActivityService...');
      const activityServiceModule = await import('../services/ActivityService.js');
      ActivityService = activityServiceModule.ActivityService;
      console.log('ActivityService imported successfully');
    } catch (importError) {
      console.error('Error importing ActivityService:', importError);
      return res.status(500).json({
        error: 'Import Error',
        message: 'Failed to import ActivityService',
        details: importError.message
      });
    }
    
    try {
      console.log('Importing errorHandler...');
      const errorHandlerModule = await import('../middleware/errorHandler.js');
      errorHandler = errorHandlerModule.errorHandler;
      console.log('errorHandler imported successfully');
    } catch (importError) {
      console.error('Error importing errorHandler:', importError);
      return res.status(500).json({
        error: 'Import Error',
        message: 'Failed to import errorHandler',
        details: importError.message
      });
    }
    
    try {
      console.log('Importing auth middleware...');
      const authModule = await import('../middleware/auth.js');
      isAuthorizedUser = authModule.isAuthorizedUser;
      logAccessAttempt = authModule.logAccessAttempt;
      console.log('Auth middleware imported successfully');
    } catch (importError) {
      console.error('Error importing auth middleware:', importError);
      return res.status(500).json({
        error: 'Import Error',
        message: 'Failed to import auth middleware',
        details: importError.message
      });
    }
    
    // Initialize services
    let lineService, activityService;
    try {
      console.log('Initializing LineService...');
      lineService = new LineService();
      console.log('LineService initialized successfully');
    } catch (initError) {
      console.error('Error initializing LineService:', initError);
      return res.status(500).json({
        error: 'Initialization Error',
        message: 'Failed to initialize LineService',
        details: initError.message
      });
    }
    
    try {
      console.log('Initializing ActivityService...');
      activityService = new ActivityService();
      console.log('ActivityService initialized successfully');
    } catch (initError) {
      console.error('Error initializing ActivityService:', initError);
      return res.status(500).json({
        error: 'Initialization Error',
        message: 'Failed to initialize ActivityService',
        details: initError.message
      });
    }
    
    // Verify LINE webhook signature
    const signature = req.headers['x-line-signature'];
    console.log('LINE signature header:', signature ? 'PRESENT' : 'MISSING');
    
    if (!signature) {
      console.log('Missing LINE signature header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing LINE signature header',
        code: 'MISSING_SIGNATURE'
      });
    }
    
    try {
      console.log('Verifying webhook signature...');
      const isValid = lineService.verifyWebhook(signature, JSON.stringify(req.body));
      console.log('Signature verification result:', isValid);
      
      if (!isValid) {
        console.log('Invalid LINE signature');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid LINE signature',
          code: 'INVALID_SIGNATURE'
        });
      }
    } catch (verifyError) {
      console.error('Error verifying webhook signature:', verifyError);
      return res.status(500).json({
        error: 'Verification Error',
        message: 'Failed to verify webhook signature',
        details: verifyError.message
      });
    }
    
    console.log('All checks passed, processing webhook...');
    // Handle LINE webhook events
    return await handleLineWebhook(req, res, lineService, activityService, isAuthorizedUser, logAccessAttempt);
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== WEBHOOK ERROR END ===');
    
    // Try to use errorHandler if available, otherwise return basic error
    try {
      if (typeof errorHandler === 'function') {
        return errorHandler(error, req, res);
      }
    } catch (handlerError) {
      console.error('Error in errorHandler:', handlerError);
    }
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleLineWebhook(req, res, lineService, activityService, isAuthorizedUser, logAccessAttempt) {
  console.log('=== HANDLING LINE WEBHOOK ===');
  const events = req.body.events;
  console.log('Events received:', events ? events.length : 'null');
  
  if (!events || events.length === 0) {
    console.log('No events to process');
    return res.status(200).json({
      success: true,
      message: 'No events to process'
    });
  }
  
  for (const event of events) {
    try {
      console.log('Processing event:', event.type);
      await processEvent(event, lineService, activityService, isAuthorizedUser, logAccessAttempt);
    } catch (error) {
      console.error('Error processing event:', error);
      // Continue processing other events even if one fails
    }
  }
  
  console.log('All events processed successfully');
  return res.status(200).json({
    success: true,
    message: 'Webhook events processed'
  });
}

async function processEvent(event, lineService, activityService, isAuthorizedUser, logAccessAttempt) {
  console.log('Processing event type:', event.type);
  switch (event.type) {
    case 'message':
      await handleMessageEvent(event, lineService, activityService, isAuthorizedUser, logAccessAttempt);
      break;
    case 'follow':
      await handleFollowEvent(event, lineService);
      break;
    case 'unfollow':
      await handleUnfollowEvent(event);
      break;
    case 'join':
      await handleGroupJoinEvent(event, lineService);
      break;
    case 'leave':
      await handleGroupLeaveEvent(event);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
}

async function handleMessageEvent(event, lineService, activityService, isAuthorizedUser, logAccessAttempt) {
  console.log('Processing message event:', JSON.stringify(event, null, 2));
  const message = event.message;
  
  // Handle different source types (user, group, room)
  let userId, sourceType, sourceId;
  
  if (event.source.type === 'user') {
    userId = event.source.userId;
    sourceType = 'user';
    sourceId = userId;
    console.log('Direct message from user:', userId);
  } else if (event.source.type === 'group') {
    userId = event.source.userId; // User who sent the message in the group
    sourceType = 'group';
    sourceId = event.source.groupId;
    console.log('Group message from user:', userId, 'in group:', sourceId);
  } else if (event.source.type === 'room') {
    userId = event.source.userId; // User who sent the message in the room
    sourceType = 'room';
    sourceId = event.source.roomId;
    console.log('Room message from user:', userId, 'in room:', sourceId);
  } else {
    console.log('Unknown source type:', event.source.type);
    return; // Skip processing unknown source types
  }
  
  // Check if user is authorized for CRUD operations
  const isAuthorized = isAuthorizedUser(userId);
  console.log('User authorized:', isAuthorized);
  
  if (message.type === 'text') {
    const userMessage = message.text.trim();
    const lowerMessage = userMessage.toLowerCase();
    console.log('Processing text message:', userMessage);
    
    // Only respond to specific commands - ignore everything else
    const isCommand = lowerMessage === 'help' || 
                     lowerMessage === '幫助' ||
                     lowerMessage === 'test' ||
                     lowerMessage.startsWith('list') ||
                     lowerMessage.startsWith('列表') ||
                     lowerMessage.startsWith('查看') ||
                     lowerMessage.startsWith('add') ||
                     lowerMessage.startsWith('create') ||
                     lowerMessage.startsWith('新增') ||
                     lowerMessage.startsWith('更新') ||
                     lowerMessage.startsWith('刪除');
    
    if (!isCommand) {
      console.log('Non-command message received, ignoring:', userMessage);
      return; // Ignore non-command messages
    }
    
    // Handle different commands
    if (lowerMessage === 'help' || lowerMessage === '幫助') {
      console.log('Handling help command');
      await sendResponseMessage(event, getHelpMessage(isAuthorized), sourceType, sourceId, lineService);
      logAccessAttempt({ body: { source: { userId } } }, 'HELP_COMMAND', true);
    } else if (lowerMessage === 'test') {
      console.log('Handling test command');
      await sendResponseMessage(event, 'Test message received! Bot is working.', sourceType, sourceId, lineService);
      logAccessAttempt({ body: { source: { userId } } }, 'TEST_COMMAND', true);
    } else if (lowerMessage === 'list' || lowerMessage === '列表' || lowerMessage === '查看 全部') {
      await handleViewAllActivities(event, sourceType, sourceId, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_ALL_ACTIVITIES', true);
    } else if (lowerMessage === '查看 這個月' || lowerMessage === '查看 本月') {
      await handleViewMonthlyActivities(event, sourceType, sourceId, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_MONTHLY_ACTIVITIES', true);
    } else if (lowerMessage === '查看 這個禮拜' || lowerMessage === '查看 本週') {
      await handleViewWeeklyActivities(event, sourceType, sourceId, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_WEEKLY_ACTIVITIES', true);
    } else if (lowerMessage === '查看 下周' || lowerMessage === '查看 下個禮拜') {
      await handleViewNextWeekActivities(event, sourceType, sourceId, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_NEXT_WEEK_ACTIVITIES', true);
    } else if (lowerMessage === '查看 下個月') {
      await handleViewNextMonthActivities(event, sourceType, sourceId, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_NEXT_MONTH_ACTIVITIES', true);
    } else if (lowerMessage === '查看 id' || lowerMessage === '查看 id') {
      await handleViewAllActivitiesWithIds(event, sourceType, sourceId, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_ALL_ACTIVITIES_WITH_IDS', true);
    } else if (userMessage.startsWith('查看 ') && (userMessage.includes('月') || userMessage.includes('Month'))) {
      await handleViewSpecificMonthActivities(event, sourceType, sourceId, userMessage, lineService, activityService);
      logAccessAttempt({ body: { source: { userId } } }, 'VIEW_SPECIFIC_MONTH_ACTIVITIES', true);
    } else if (userMessage.startsWith('add') || userMessage.startsWith('create') || userMessage.startsWith('新增')) {
      if (isAuthorized) {
        await handleCreateActivity(event, sourceType, sourceId, userMessage, lineService, activityService);
        logAccessAttempt({ body: { source: { userId } } }, 'CREATE_COMMAND', true);
      } else {
        await sendResponseMessage(event, 'Sorry, you are not authorized to create activities. Contact the administrator.', sourceType, sourceId, lineService);
        logAccessAttempt({ body: { source: { userId } } }, 'CREATE_COMMAND', false);
      }
    } else if (userMessage.startsWith('更新 ')) {
      if (isAuthorized) {
        await handleUpdateActivity(event, sourceType, sourceId, userMessage, lineService, activityService);
        logAccessAttempt({ body: { source: { userId } } }, 'UPDATE_COMMAND', true);
      } else {
        await sendResponseMessage(event, 'Sorry, you are not authorized to update activities. Contact the administrator.', sourceType, sourceId, lineService);
        logAccessAttempt({ body: { source: { userId } } }, 'UPDATE_COMMAND', false);
      }
    } else if (userMessage.startsWith('刪除 ')) {
      if (isAuthorized) {
        await handleDeleteActivity(event, sourceType, sourceId, userMessage, lineService, activityService);
        logAccessAttempt({ body: { source: { userId } } }, 'DELETE_COMMAND', true);
      } else {
        await sendResponseMessage(event, 'Sorry, you are not authorized to delete activities. Contact the administrator.', sourceType, sourceId, lineService);
        logAccessAttempt({ body: { source: { userId } } }, 'DELETE_COMMAND', false);
      }
    } else {
      console.log('Unknown command received:', userMessage);
      // Don't respond to unknown commands - just log and ignore
      logAccessAttempt({ body: { source: { userId } } }, 'UNKNOWN_COMMAND', false);
    }
  }
}

async function handleFollowEvent(event, lineService) {
  console.log('Handling follow event for user:', event.source.userId);
  const userId = event.source.userId;
  const welcomeMessage = `歡迎使用教會行事曆機器人！\n\n我可以幫您：\n• 管理教會活動\n• 發送提醒通知\n\n輸入 "help" 查看可用指令。`;
  
  try {
    // Send welcome message
    await lineService.sendMessage(userId, welcomeMessage);
    console.log('Welcome message sent successfully');
  } catch (error) {
    console.error('Error handling follow event:', error);
  }
}

async function handleGroupJoinEvent(event, lineService) {
  console.log('Handling group join event for group:', event.source.groupId);
  const groupId = event.source.groupId;
  const welcomeMessage = `歡迎使用教會行事曆機器人！\n\n我可以幫您：\n• 管理教會活動\n• 發送提醒通知\n\n輸入 "help" 查看可用指令。`;
  
  try {
    // Import GroupService
    const { GroupService } = await import('../services/GroupService.js');
    const groupService = new GroupService();
    
    // Add group to database
    await groupService.addGroup(groupId);
    console.log(`Group ${groupId} added to database`);
    
    // Send welcome message
    await lineService.sendMessage(groupId, welcomeMessage);
    console.log('Welcome message sent to group successfully');
  } catch (error) {
    console.error('Error handling group join event:', error);
  }
}

async function handleUnfollowEvent(event) {
  // Log unfollow event for analytics
  console.log('User unfollowed:', event.source.userId);
}

async function handleGroupLeaveEvent(event) {
  // Log group leave event for analytics
  console.log('Bot left group:', event.source.groupId);
  
  try {
    // Import GroupService
    const { GroupService } = await import('../services/GroupService.js');
    const groupService = new GroupService();
    
    // Remove group from database
    await groupService.removeGroup(event.source.groupId);
    console.log(`Group ${event.source.groupId} removed from database`);
  } catch (error) {
    console.error('Error handling group leave event:', error);
  }
}

// Helper function to send messages to different source types
async function sendResponseMessage(event, message, sourceType, sourceId, lineService) {
  console.log(`Attempting to send message. SourceType: ${sourceType}, SourceId: ${sourceId}, ReplyToken: ${event.replyToken}`);
  
  try {
    if (sourceType === 'user') {
      // For direct messages, use the regular sendMessage method
      console.log('Sending direct message to user:', sourceId);
      await lineService.sendMessage(sourceId, message);
      console.log('Direct message sent successfully');
    } else {
      // For group/room messages, try reply first, then fallback to direct message
      if (event.replyToken) {
        try {
          console.log('Sending reply message with token:', event.replyToken);
          await lineService.sendReplyMessage(event.replyToken, message);
          console.log('Reply message sent successfully');
          return;
        } catch (replyError) {
          console.error('Reply message failed, trying direct message fallback:', replyError);
        }
      } else {
        console.log('No reply token available, using direct message');
      }
      
      // Fallback to direct message
      console.log('Sending fallback direct message to user:', event.source.userId);
      await lineService.sendMessage(event.source.userId, message);
      console.log('Fallback direct message sent successfully');
    }
  } catch (error) {
    console.error('All message sending methods failed:', error);
    throw error;
  }
}

async function handleViewAllActivities(event, sourceType, sourceId, lineService, activityService) {
  try {
    console.log('Fetching all activities...');
    const activities = await activityService.getActivities();
    console.log('Activities found:', activities ? activities.length : 0);
    
    if (activities && activities.length > 0) {
      let message = '所有活動：\n';
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
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, '目前沒有活動安排。', sourceType, sourceId, lineService);
    }
  } catch (error) {
    console.error('Error fetching all activities:', error);
    await sendResponseMessage(event, '無法取得活動列表，請稍後再試。', sourceType, sourceId, lineService);
  }
}

async function handleViewAllActivitiesWithIds(event, sourceType, sourceId, lineService, activityService) {
  try {
    const activities = await activityService.getActivities();
    if (activities && activities.length > 0) {
      let message = '所有活動（含ID）：\n';
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
        
        message += `• ID: ${activity.id} | ${month}/${day} ${dayOfWeek}${timeRange} ${activity.name}\n`;
      });
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, '目前沒有活動安排。', sourceType, sourceId, lineService);
    }
  } catch (error) {
    console.error('Error fetching all activities with IDs:', error);
    await sendResponseMessage(event, '無法取得活動列表，請稍後再試。', sourceType, sourceId, lineService);
  }
}


async function handleViewMonthlyActivities(event, sourceType, sourceId, lineService, activityService) {
  try {
    const { month, year } = getCurrentMonthAndYear();
    const activities = await activityService.getActivitiesForMonth(month, year);
    if (activities && activities.length > 0) {
      let message = '本月活動：\n';
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
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, '目前沒有本月活動安排。', sourceType, sourceId, lineService);
    }
  } catch (error) {
    console.error('Error fetching monthly activities:', error);
    await sendResponseMessage(event, '無法取得本月活動，請稍後再試。', sourceType, sourceId, lineService);
  }
}

async function handleViewWeeklyActivities(event, sourceType, sourceId, lineService, activityService) {
  try {
    const activities = await activityService.getActivitiesForThisWeek();
    if (activities && activities.length > 0) {
      let message = '本週活動：\n';
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
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, '目前沒有本週活動安排。', sourceType, sourceId, lineService);
    }
  } catch (error) {
    console.error('Error fetching weekly activities:', error);
    await sendResponseMessage(event, '無法取得本週活動，請稍後再試。', sourceType, sourceId, lineService);
  }
}

async function handleViewNextWeekActivities(event, sourceType, sourceId, lineService, activityService) {
  try {
    const activities = await activityService.getActivitiesForNextWeek();
    if (activities && activities.length > 0) {
      let message = '下周活動：\n';
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
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, '目前沒有下周活動安排。', sourceType, sourceId, lineService);
    }
  } catch (error) {
    console.error('Error fetching next week activities:', error);
    await sendResponseMessage(event, '無法取得下周活動，請稍後再試。', sourceType, sourceId, lineService);
  }
}

async function handleViewNextMonthActivities(event, sourceType, sourceId, lineService, activityService) {
  try {
    const { month, year } = getNextMonthAndYear();
    const activities = await activityService.getActivitiesForMonth(month, year);
    if (activities && activities.length > 0) {
      let message = '下個月活動：\n';
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
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, '目前沒有下個月活動安排。', sourceType, sourceId, lineService);
    }
  } catch (error) {
    console.error('Error fetching next month activities:', error);
    await sendResponseMessage(event, '無法取得下個月活動，請稍後再試。', sourceType, sourceId, lineService);
  }
}

async function handleViewSpecificMonthActivities(event, sourceType, sourceId, userMessage, lineService, activityService) {
  try {
    const { month, year } = parseMonthFromMessage(userMessage);
    const activities = await activityService.getActivitiesForMonth(month, year);
    const monthName = getMonthName(month);
    
    if (activities && activities.length > 0) {
      let message = `${year}年${monthName}活動：\n`;
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
      await sendResponseMessage(event, message.trim(), sourceType, sourceId, lineService);
    } else {
      await sendResponseMessage(event, `目前沒有${year}年${monthName}活動安排。`, sourceType, sourceId, lineService);
    }
  } catch (error) {
    if (error.message === 'Invalid month format') {
      await sendResponseMessage(event, '月份格式錯誤。請使用：查看 11月 或 查看 十一月', sourceType, sourceId, lineService);
    } else {
      console.error('Error fetching specific month activities:', error);
      await sendResponseMessage(event, '無法取得指定月份活動，請稍後再試。', sourceType, sourceId, lineService);
    }
  }
}


async function handleUpdateActivity(event, sourceType, sourceId, userMessage, lineService, activityService) {
  try {
    // Parse command: "更新 id [名稱/時間/日期] [value]"
    const parts = userMessage.split(' ');
    if (parts.length < 4) {
      await sendResponseMessage(event, '格式錯誤。請使用：\n• 更新 [ID] 名稱 [新名稱]\n• 更新 [ID] 時間 [開始時間-結束時間]\n• 更新 [ID] 日期 [YYYY-MM-DD]\n例如：更新 17 名稱 教導站桌遊活動', sourceType, sourceId, lineService);
      return;
    }

    const activityId = parseInt(parts[1]);
    const updateType = parts[2];
    const updateValue = parts.slice(3).join(' ');

    let updateData = {};

    if (updateType === '名稱') {
      updateData.name = updateValue;
    } else if (updateType === '時間') {
      // Parse time range format like "22:00-24:00"
      const timeRange = updateValue.split('-');
      if (timeRange.length !== 2) {
        await sendResponseMessage(event, '時間格式錯誤。請使用：開始時間-結束時間\n例如：22:00-24:00', sourceType, sourceId, lineService);
        return;
      }
      
      const startTime = timeRange[0].trim();
      const endTime = timeRange[1].trim();
      
      // Validate time format (accept 24:00 as end time)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const endTimeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$|^24:00$/;
      if (!timeRegex.test(startTime) || !endTimeRegex.test(endTime)) {
        await sendResponseMessage(event, '時間格式錯誤。請使用 HH:MM 格式\n例如：22:00-24:00', sourceType, sourceId, lineService);
        return;
      }
      
      // Check if start time is before end time
      if (startTime >= endTime) {
        await sendResponseMessage(event, '開始時間必須早於結束時間。', sourceType, sourceId, lineService);
        return;
      }
      
      updateData.start_time = startTime;
      updateData.end_time = endTime;
    } else if (updateType === '日期') {
      if (!isValidDate(updateValue)) {
        await sendResponseMessage(event, '日期格式錯誤。請使用 YYYY-MM-DD 格式\n例如：2025-10-15', sourceType, sourceId, lineService);
        return;
      }
      updateData.date = updateValue;
    } else {
      await sendResponseMessage(event, '更新類型錯誤。請使用：名稱、時間 或 日期\n例如：更新 17 名稱 教導站桌遊活動', sourceType, sourceId, lineService);
      return;
    }

    const updatedActivity = await activityService.updateActivity(activityId, updateData);
    await sendResponseMessage(event, `✅ 活動已成功更新：\n${formatActivityForDisplay(updatedActivity)}`, sourceType, sourceId, lineService);
  } catch (error) {
    if (error.message === 'Activity not found') {
      await sendResponseMessage(event, '找不到指定的活動。', sourceType, sourceId, lineService);
    } else {
      console.error('Error updating activity:', error);
      await sendResponseMessage(event, '更新活動時發生錯誤，請稍後再試。', sourceType, sourceId, lineService);
    }
  }
}

async function handleCreateActivity(event, sourceType, sourceId, userMessage, lineService, activityService) {
  try {
    // Parse command: "新增 日期 [時間] 活動名稱"
    // Support formats: "新增 2025-01-15 主日崇拜" or "新增 2025-01-15 09:00-11:00 主日崇拜"
    const parts = userMessage.split(' ');
    if (parts.length < 3) {
      await sendResponseMessage(event, '格式錯誤。請使用：\n• 新增 [日期] [活動名稱]\n• 新增 [日期] [開始時間-結束時間] [活動名稱]\n例如：新增 2025-01-15 主日崇拜\n例如：新增 2025-01-15 09:00-11:00 主日崇拜', sourceType, sourceId, lineService);
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
      await sendResponseMessage(event, '日期格式錯誤。請使用 YYYY-MM-DD 格式，例如：2025-01-15', sourceType, sourceId, lineService);
      return;
    }

    // Validate time format if provided
    if (startTime && !isValidTime(startTime)) {
      await sendResponseMessage(event, '開始時間格式錯誤。請使用 HH:MM 格式，例如：09:00', sourceType, sourceId, lineService);
      return;
    }

    if (endTime && !isValidTime(endTime)) {
      await sendResponseMessage(event, '結束時間格式錯誤。請使用 HH:MM 格式，例如：11:00', sourceType, sourceId, lineService);
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

    await sendResponseMessage(event, `✅ 活動已成功新增：\n${formatActivityForDisplay(newActivity)}`, sourceType, sourceId, lineService);
  } catch (error) {
    if (error.message.includes('validation') || error.message.includes('required')) {
      await sendResponseMessage(event, '資料驗證錯誤：' + error.message, sourceType, sourceId, lineService);
    } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
      await sendResponseMessage(event, '此日期和活動名稱已存在，請使用不同的組合。', sourceType, sourceId, lineService);
    } else {
      console.error('Error creating activity:', error);
      await sendResponseMessage(event, '新增活動時發生錯誤，請稍後再試。', sourceType, sourceId, lineService);
    }
  }
}

async function handleDeleteActivity(event, sourceType, sourceId, userMessage, lineService, activityService) {
  try {
    // Parse command: "刪除 id"
    const parts = userMessage.split(' ');
    if (parts.length !== 2) {
      await sendResponseMessage(event, '格式錯誤。請使用：刪除 [ID]\n例如：刪除 1', sourceType, sourceId, lineService);
      return;
    }

    const activityId = parseInt(parts[1]);
    
    // Get activity details before deletion for confirmation message
    const activity = await activityService.getActivityById(activityId);
    await activityService.deleteActivity(activityId);
    
    await sendResponseMessage(event, `✅ 活動已成功刪除：\n${formatActivityForDisplay(activity)}`, sourceType, sourceId, lineService);
  } catch (error) {
    if (error.message === 'Activity not found') {
      await sendResponseMessage(event, '找不到指定的活動。', sourceType, sourceId, lineService);
    } else {
      console.error('Error deleting activity:', error);
      await sendResponseMessage(event, '刪除活動時發生錯誤，請稍後再試。', sourceType, sourceId, lineService);
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

// Helper functions for date/time formatting
function getDayOfWeek(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const days = [
    '星期日', '星期一', '星期二', '星期三', 
    '星期四', '星期五', '星期六'
  ];
  
  return days[d.getDay()];
}

function getHelpMessage(isAuthorized = false) {
  let message = `📅 教會行事曆助理 📅\n\n查詢功能：\n• 查看 全部 - 查看所有活動\n• 查看 id - 查看所有活動（含ID）\n• 查看 這個月 - 查看本月活動\n• 查看 下個月 - 查看下個月活動\n• 查看 這個禮拜 - 查看本週活動\n• 查看 下周 - 查看下周活動\n• 查看 11月 - 查看指定月份活動`;
  
  if (isAuthorized) {
    message += `\n\n管理員功能：\n• 新增 [日期] [活動名稱] - 新增活動\n• 新增 [日期] [時間] [活動名稱] - 新增帶時間的活動\n• 更新 [ID] [日期/名稱/時間] - 更新活動\n• 刪除 [ID] - 刪除活動\n\n範例：\n• 新增 2025-01-15 烤肉活動\n• 新增 2025-01-15 09:00-11:00 卡拉OK活動`;
  }
  
  message += `\n\n更多功能即將推出！`;
  
  return message;
}
  