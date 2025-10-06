// Utility functions
export function formatDate(date) {
  if (!date) return null;
  
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${month}-${day}-${year}`;
}

export function getDayOfWeek(date) {
  if (!date) return null;
  
  const d = new Date(date);
  const days = [
    '星期日', '星期一', '星期二', '星期三', 
    '星期四', '星期五', '星期六'
  ];
  
  return days[d.getDay()];
}

export function formatActivityMessage(activities, type = 'list') {
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

  return message.trim();
}

// Helper function to format time to HH:MM
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

export function validateDate(dateString) {
  if (!dateString) return false;
  
  // Check if it's a valid date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
}

export function parseDateString(dateString) {
  // Parse mm-dd-yyyy format to Date object
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const month = parseInt(parts[0]) - 1; // JavaScript months are 0-based
  const day = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  const date = new Date(year, month, day);
  
  // Validate the date
  if (date.getMonth() !== month || date.getDate() !== day || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
}

export function getTaipeiTime() {
  const now = new Date();
  const taipeiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
  return taipeiTime;
}

export function getDateRange(daysFromNow) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + daysFromNow);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  
  return { startDate, endDate };
}

export function formatErrorMessage(error) {
  if (error.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 255); // Limit length
}

export function isValidActivityName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 255;
}

export function getCurrentMonthAndYear() {
  const now = getTaipeiTime();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}
