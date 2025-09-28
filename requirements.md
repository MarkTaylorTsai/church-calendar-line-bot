# Requirements - LINE Bot Reminder App

## Project Overview

A LINE bot that manages church activities and automatically sends reminders to users. The bot provides CRUD operations for activities and sends scheduled messages for monthly overviews, weekly reminders, and daily reminders.

## Functional Requirements

### 1. Activity Management (CRUD Operations)

#### 1.1 Create Activity

- **Input**: Activity name and date
- **Validation**: Date format validation (mm-dd-yyyy)
- **Output**: Confirmation message with created activity details
- **Error Handling**: Invalid date format, duplicate activities

#### 1.2 Read Activities

- **Get All Activities**: Retrieve complete list of activities
- **Get by Month**: Filter activities by specific month/year
- **Format**: `日期(mm-dd-yyyy) 星期幾(day) 名稱`
- **Example**: `09-28-2025 星期日 主日聚會`

#### 1.3 Update Activity

- **Input**: Activity ID, updated name and/or date
- **Validation**: Date format validation
- **Output**: Confirmation with updated activity details
- **Error Handling**: Activity not found, invalid date format

#### 1.4 Delete Activity

- **Input**: Activity ID
- **Output**: Confirmation of deletion
- **Error Handling**: Activity not found

### 2. Reminder System

#### 2.1 Monthly Overview

- **Trigger**: 1st day of each month at 6:00 PM (Taipei time)
- **Content**: List all activities for the current month
- **Format**:
  ```
  本月活動：
  09-07-2025 星期日 青年聚會
  09-14-2025 星期日 主日聚會
  09-28-2025 星期日 主日聚會
  ```

#### 2.2 Weekly Reminder

- **Trigger**: Daily at 6:00 PM (Taipei time)
- **Logic**: Check for activities happening in 7 days
- **Format**:
  ```
  提醒您，下週有活動：
  09-28-2025 星期日 主日聚會
  ```

#### 2.3 Daily Reminder

- **Trigger**: Daily at 6:00 PM (Taipei time)
- **Logic**: Check for activities happening tomorrow
- **Format**:
  ```
  提醒您，明天有活動：
  09-28-2025 星期日 主日聚會
  ```

## Technical Requirements

### 3. Technology Stack

#### 3.1 Backend

- **Framework**: Node.js + Express
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Scheduling**: cron-job.org

#### 3.2 External Services

- **LINE Messaging API**: Send messages to users
- **cron-job.org**: Trigger scheduled tasks
- **Supabase**: Database hosting and management

### 4. Database Schema

#### 4.1 Activities Table

```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.2 Indexes

- Primary key on `id`
- Index on `date` for efficient querying
- Index on `created_at` for audit purposes

### 5. API Endpoints

#### 5.1 Activity Management

- `GET /activities` - List all activities (optional filters: month, year)
- `POST /activities` - Add new activity
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity

#### 5.2 Reminder Endpoints

- `POST /send-monthly-overview` - Send monthly overview
- `POST /send-weekly-reminders` - Send weekly reminders
- `POST /send-daily-reminders` - Send daily reminders

### 6. Data Validation

#### 6.1 Date Format

- **Format**: mm-dd-yyyy
- **Validation**: Valid date, not in the past
- **Timezone**: Taipei time (UTC+8)

#### 6.2 Activity Name

- **Length**: 1-255 characters
- **Characters**: Unicode supported
- **Required**: Yes

### 7. Error Handling

#### 7.1 Database Errors

- Connection failures
- Query timeouts
- Constraint violations

#### 7.2 API Errors

- Invalid request format
- Missing required fields
- Authentication failures

#### 7.3 LINE API Errors

- Rate limiting
- Invalid user IDs
- Message delivery failures

### 8. Performance Requirements

#### 8.1 Response Time

- API endpoints: < 2 seconds
- Database queries: < 1 second
- LINE message delivery: < 5 seconds

#### 8.2 Scalability

- Support up to 1000 activities
- Handle up to 100 concurrent users
- Process reminders for up to 500 users

### 9. Security Requirements

#### 9.1 Authentication

- LINE webhook verification
- API key protection for cron jobs
- Database connection security

#### 9.2 Data Protection

- Input sanitization
- SQL injection prevention
- XSS protection

### 10. Monitoring and Logging

#### 10.1 Logging

- API request/response logs
- Error logs with stack traces
- Reminder delivery logs

#### 10.2 Monitoring

- Database connection status
- LINE API rate limits
- Cron job execution status

## Non-Functional Requirements

### 11. Availability

- 99.9% uptime target
- Graceful degradation during outages
- Automatic retry mechanisms

### 12. Maintainability

- Clean, documented code
- Modular architecture
- Comprehensive error handling

### 13. Usability

- Intuitive LINE bot commands
- Clear error messages
- Helpful user guidance
