# Design - LINE Bot Reminder App

## System Architecture

### 1. High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LINE Users    │    │   cron-job.org   │    │   Vercel App    │
│                 │◄───┤                 ├───►│                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  LINE Messaging │    │    Supabase     │
                       │      API        │    │   (PostgreSQL)  │
                       └─────────────────┘    └─────────────────┘
```

### 2. Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Express App                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Routes    │  │  Services   │  │  Database   │         │
│  │             │  │             │  │   Layer     │         │
│  │ • /activities│  │ • Activity  │  │             │         │
│  │ • /reminders│  │ • Reminder  │  │ • Supabase  │         │
│  │ • /webhook  │  │ • LINE API  │  │ • Queries   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### 3. Entity Relationship Diagram

```
┌─────────────────┐
│   activities    │
├─────────────────┤
│ id (PK)         │
│ name            │
│ date            │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### 4. Database Schema Details

#### 4.1 Activities Table

```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_created_at ON activities(created_at);
```

#### 4.2 Data Types and Constraints

- **id**: Auto-incrementing primary key
- **name**: VARCHAR(255) with NOT NULL constraint
- **date**: DATE type for efficient date operations
- **created_at/updated_at**: Timestamps with timezone support

## API Design

### 5. RESTful API Structure

#### 5.1 Activity Endpoints

```
GET    /api/activities           # List all activities
GET    /api/activities?month=09&year=2025  # Filter by month/year
POST   /api/activities           # Create new activity
PUT    /api/activities/:id       # Update activity
DELETE /api/activities/:id       # Delete activity
```

#### 5.2 Reminder Endpoints

```
POST   /api/reminders/monthly   # Send monthly overview
POST   /api/reminders/weekly    # Send weekly reminders
POST   /api/reminders/daily     # Send daily reminders
```

#### 5.3 Webhook Endpoint

```
POST   /api/webhook             # LINE webhook for user interactions
```

### 6. Request/Response Formats

#### 6.1 Create Activity Request

```json
{
  "name": "主日聚會",
  "date": "2025-09-28"
}
```

#### 6.2 Activity Response

```json
{
  "id": 1,
  "name": "主日聚會",
  "date": "2025-09-28",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### 6.3 Error Response

```json
{
  "error": "Validation Error",
  "message": "Invalid date format. Expected mm-dd-yyyy",
  "code": "INVALID_DATE_FORMAT"
}
```

## Service Layer Design

### 7. Service Architecture

#### 7.1 Activity Service

```javascript
class ActivityService {
  async createActivity(data) {}
  async getActivities(filters) {}
  async updateActivity(id, data) {}
  async deleteActivity(id) {}
  async getActivitiesByDateRange(startDate, endDate) {}
}
```

#### 7.2 Reminder Service

```javascript
class ReminderService {
  async sendMonthlyOverview() {}
  async sendWeeklyReminders() {}
  async sendDailyReminders() {}
  async formatActivityMessage(activities) {}
}
```

#### 7.3 LINE Service

```javascript
class LineService {
  async sendMessage(userId, message) {}
  async sendBroadcastMessage(message) {}
  async verifyWebhook(signature, body) {}
}
```

### 8. Data Flow Design

#### 8.1 Activity Creation Flow

```
User Input → Validation → Database Insert → Confirmation Message
```

#### 8.2 Reminder Flow

```
Cron Trigger → Query Database → Format Message → Send via LINE API
```

#### 8.3 Error Handling Flow

```
Error Occurred → Log Error → Return User-Friendly Message → Alert Admin
```

## Security Design

### 9. Authentication & Authorization

#### 9.1 LINE Webhook Verification

```javascript
const crypto = require("crypto");

function verifyLineSignature(signature, body, channelSecret) {
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return signature === hash;
}
```

#### 9.2 API Key Protection

- Environment variables for sensitive keys
- Rate limiting for API endpoints
- Input validation and sanitization

### 10. Data Security

#### 10.1 Input Validation

- Date format validation
- SQL injection prevention
- XSS protection in messages

#### 10.2 Database Security

- Connection string encryption
- Query parameterization
- Access control via Supabase RLS

## Deployment Design

### 11. Vercel Configuration

#### 11.1 Project Structure

```
church-calendar-line-bot/
├── api/
│   ├── activities.js
│   ├── reminders.js
│   └── webhook.js
├── lib/
│   ├── database.js
│   ├── line.js
│   └── utils.js
├── vercel.json
└── package.json
```

#### 11.2 Environment Variables

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
```

### 12. Cron Job Configuration

#### 12.1 Monthly Overview

- **Schedule**: `0 18 1 * *` (1st day, 6 PM Taipei time)
- **Endpoint**: `https://your-app.vercel.app/api/reminders/monthly`

#### 12.2 Weekly Reminders

- **Schedule**: `0 18 * * *` (Daily at 6 PM Taipei time)
- **Endpoint**: `https://your-app.vercel.app/api/reminders/weekly`

#### 12.3 Daily Reminders

- **Schedule**: `0 18 * * *` (Daily at 6 PM Taipei time)
- **Endpoint**: `https://your-app.vercel.app/api/reminders/daily`

## Error Handling Design

### 13. Error Classification

#### 13.1 User Errors (4xx)

- Invalid date format
- Missing required fields
- Activity not found

#### 13.2 Server Errors (5xx)

- Database connection failures
- LINE API rate limits
- Internal processing errors

#### 13.3 External Service Errors

- Supabase downtime
- LINE API failures
- Cron job timeouts

### 14. Error Response Strategy

#### 14.1 User-Facing Messages

- Clear, actionable error messages
- Chinese language support
- Helpful suggestions for fixes

#### 14.2 Logging Strategy

- Structured logging with context
- Error tracking and monitoring
- Performance metrics collection

## Performance Design

### 15. Optimization Strategies

#### 15.1 Database Optimization

- Indexed queries for date ranges
- Connection pooling
- Query result caching

#### 15.2 API Optimization

- Response compression
- Request validation early
- Efficient data serialization

#### 15.3 LINE API Optimization

- Batch message sending
- Rate limit handling
- Retry mechanisms with backoff

### 16. Scalability Considerations

#### 16.1 Horizontal Scaling

- Stateless application design
- Database connection management
- Load balancing ready

#### 16.2 Vertical Scaling

- Memory optimization
- CPU usage monitoring
- Resource allocation planning
