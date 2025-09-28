// Activity data model
import { formatDate, getDayOfWeek } from '../lib/utils.js';

export class Activity {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.date = data.date;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      date: this.date,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  formatForDisplay() {
    const formattedDate = formatDate(this.date);
    const dayOfWeek = getDayOfWeek(this.date);
    return `${formattedDate} ${dayOfWeek} ${this.name}`;
  }

  formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month}-${day}-${year}`;
  }

  getDayOfWeek(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const days = [
      '星期日', '星期一', '星期二', '星期三', 
      '星期四', '星期五', '星期六'
    ];
    
    return days[d.getDay()];
  }

  isPast() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = new Date(this.date);
    activityDate.setHours(0, 0, 0, 0);
    
    return activityDate < today;
  }

  isToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = new Date(this.date);
    activityDate.setHours(0, 0, 0, 0);
    
    return activityDate.getTime() === today.getTime();
  }

  isTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const activityDate = new Date(this.date);
    activityDate.setHours(0, 0, 0, 0);
    
    return activityDate.getTime() === tomorrow.getTime();
  }

  isThisWeek() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const activityDate = new Date(this.date);
    
    return activityDate >= weekStart && activityDate <= weekEnd;
  }

  isNextWeek() {
    const today = new Date();
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
    nextWeekStart.setHours(0, 0, 0, 0);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);
    
    const activityDate = new Date(this.date);
    
    return activityDate >= nextWeekStart && activityDate <= nextWeekEnd;
  }

  isThisMonth() {
    const today = new Date();
    const activityDate = new Date(this.date);
    
    return activityDate.getMonth() === today.getMonth() && 
           activityDate.getFullYear() === today.getFullYear();
  }

  getDaysUntil() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDate = new Date(this.date);
    activityDate.setHours(0, 0, 0, 0);
    
    const diffTime = activityDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getStatus() {
    if (this.isPast()) {
      return 'past';
    } else if (this.isToday()) {
      return 'today';
    } else if (this.isTomorrow()) {
      return 'tomorrow';
    } else if (this.isThisWeek()) {
      return 'this_week';
    } else if (this.isNextWeek()) {
      return 'next_week';
    } else {
      return 'future';
    }
  }

  getStatusText() {
    const status = this.getStatus();
    const statusTexts = {
      'past': '已過期',
      'today': '今天',
      'tomorrow': '明天',
      'this_week': '本週',
      'next_week': '下週',
      'future': '未來'
    };
    
    return statusTexts[status] || '未知';
  }

  getDaysUntilText() {
    const days = this.getDaysUntil();
    
    if (days < 0) {
      return `${Math.abs(days)}天前`;
    } else if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '明天';
    } else {
      return `${days}天後`;
    }
  }

  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Activity name is required');
    } else if (this.name.length > 255) {
      errors.push('Activity name is too long (max 255 characters)');
    }
    
    if (!this.date) {
      errors.push('Activity date is required');
    } else {
      const date = new Date(this.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      }
    }
    
    return errors;
  }

  static fromJSON(json) {
    return new Activity(json);
  }

  static create(data) {
    const activity = new Activity(data);
    const errors = activity.validate();
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return activity;
  }
}
