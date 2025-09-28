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
      message = '本月活動：\n';
      break;
    case 'weekly':
      message = '提醒您，下週有活動：\n';
      break;
    case 'daily':
      message = '提醒您，明天有活動：\n';
      break;
    default:
      message = '活動列表：\n';
  }

  activities.forEach(activity => {
    const formattedDate = formatDate(activity.date);
    const dayOfWeek = getDayOfWeek(activity.date);
    message += `${formattedDate} ${dayOfWeek} ${activity.name}\n`;
  });

  return message.trim();
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
