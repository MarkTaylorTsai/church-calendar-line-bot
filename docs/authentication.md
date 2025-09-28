# Authentication System

## Overview

The Church Calendar LINE Bot implements a comprehensive authentication system with two levels of access control:

1. **LINE User Authentication** - Controls who can perform CRUD operations
2. **Cron Job Authentication** - Secures automated reminder endpoints

## LINE User Authentication

### Configuration

Set the `LINE_USER_ID` environment variable with authorized user IDs:

```bash
# Single user
LINE_USER_ID=U1234567890abcdef

# Multiple users (comma-separated)
LINE_USER_ID=U1234567890abcdef,U9876543210fedcba,U1111111111111111

# No restrictions (empty or not set)
LINE_USER_ID=
```

### How It Works

- **Authorized Users**: Can perform all CRUD operations (Create, Read, Update, Delete activities)
- **All Users**: Can view activities and use basic bot commands (GET operations are open to everyone)
- **No Restrictions**: If `LINE_USER_ID` is empty, all users have full access

### User ID Sources

The system checks for user ID in the following order:

1. `x-line-user-id` header
2. `req.body.source.userId` (from LINE webhook)

### Access Control

| Operation              | Authorized Users | All Users             |
| ---------------------- | ---------------- | --------------------- |
| GET /api/activities    | ✅ Full access   | ✅ Read access        |
| POST /api/activities   | ✅ Create        | ❌ Denied             |
| PUT /api/activities    | ✅ Update        | ❌ Denied             |
| DELETE /api/activities | ✅ Delete        | ❌ Denied             |
| LINE Bot Commands      | ✅ All commands  | ✅ View commands only |

### LINE Bot Commands

#### Available to All Users

- `help` / `幫助` - Show help message
- `查看 全部` - View all activities (with IDs)
- `查看 這個月` / `查看 本月` - View current month activities (with IDs)
- `查看 這個禮拜` / `查看 本週` - View current week activities (without IDs)
- `查看 [ID]` - View specific activity details

#### Available to Authorized Users Only

- `新增` / `add` / `create` - Create new activity (admin function)
- `更新 [ID] [日期/名稱]` - Update activity (admin function)
- `刪除 [ID]` - Delete activity (admin function)

## Cron Job Authentication

### Configuration

Set the `CRON_API_KEY` environment variable:

```bash
CRON_API_KEY=your-secure-random-api-key-here
```

### How It Works

- **API Key Required**: All reminder endpoints require authentication
- **Header-based**: Pass API key in `x-api-key` header or `api_key` query parameter
- **Secure**: Prevents unauthorized access to reminder triggers

### Protected Endpoints

| Endpoint                         | Authentication Required |
| -------------------------------- | ----------------------- |
| POST /api/reminders?type=monthly | ✅ CRON_API_KEY         |
| POST /api/reminders?type=weekly  | ✅ CRON_API_KEY         |
| POST /api/reminders?type=daily   | ✅ CRON_API_KEY         |

### Usage Examples

```bash
# Using header
curl -X POST https://your-app.vercel.app/api/reminders?type=monthly \
  -H "x-api-key: your-secure-random-api-key-here"

# Using query parameter
curl -X POST "https://your-app.vercel.app/api/reminders?type=monthly&api_key=your-secure-random-api-key-here"
```

## Cron Job Configuration

### cron-job.org Setup

1. **Monthly Overview**

   - URL: `https://your-app.vercel.app/api/reminders?type=monthly`
   - Schedule: `0 18 1 * *` (1st day, 6 PM Taipei time)
   - Headers: `x-api-key: your-secure-random-api-key-here`

2. **Weekly Reminders**

   - URL: `https://your-app.vercel.app/api/reminders?type=weekly`
   - Schedule: `0 18 * * *` (Daily at 6 PM Taipei time)
   - Headers: `x-api-key: your-secure-random-api-key-here`

3. **Daily Reminders**
   - URL: `https://your-app.vercel.app/api/reminders?type=daily`
   - Schedule: `0 18 * * *` (Daily at 6 PM Taipei time)
   - Headers: `x-api-key: your-secure-random-api-key-here`

## Security Features

### Access Logging

All authentication attempts are logged with:

- User ID
- Action performed
- Success/failure status
- Timestamp
- IP address

### Error Responses

#### Unauthorized Access

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "LINE User ID is required",
  "code": "MISSING_USER_ID"
}
```

#### Access Denied

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied. You are not authorized to perform this action.",
  "code": "ACCESS_DENIED"
}
```

#### Invalid API Key

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

## Environment Variables

### Required Variables

```bash
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Authentication Variables

```bash
# User Access Control (optional)
LINE_USER_ID=U1234567890abcdef,U9876543210fedcba

# Cron Job Authentication (required)
CRON_API_KEY=your-secure-random-api-key-here
```

## Best Practices

### Security

1. **Use Strong API Keys**: Generate cryptographically secure random keys
2. **Rotate Keys Regularly**: Change API keys periodically
3. **Monitor Access Logs**: Review authentication logs for suspicious activity
4. **Limit User Access**: Only authorize necessary users for CRUD operations

### Configuration

1. **Environment Variables**: Store sensitive data in environment variables
2. **Multiple Users**: Use comma-separated format for multiple authorized users
3. **No Restrictions**: Leave `LINE_USER_ID` empty for open access (development only)

### Monitoring

1. **Access Logs**: Monitor authentication success/failure rates
2. **Error Tracking**: Set up alerts for authentication failures
3. **User Activity**: Track which users are performing which operations

## Troubleshooting

### Common Issues

1. **"Access denied" errors**

   - Check if user ID is in `LINE_USER_ID` environment variable
   - Verify user ID format (should start with 'U')

2. **"Invalid API key" errors**

   - Verify `CRON_API_KEY` environment variable is set
   - Check API key in request headers or query parameters

3. **"Missing User ID" errors**
   - Ensure LINE webhook is properly configured
   - Check if user ID is being passed in request

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will provide detailed authentication logs for troubleshooting.
