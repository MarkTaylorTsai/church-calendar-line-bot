# Cron Job Configuration

This document explains how to set up cron jobs for the church calendar LINE bot, including the new cleanup functionality.

## Required Environment Variables

Make sure you have the following environment variable set:

```bash
CRON_API_KEY=your-secure-random-api-key-here
```

## Cron Job Endpoints

### 1. Monthly Overview

- **URL**: `https://your-app.vercel.app/api/reminders?type=monthly`
- **Schedule**: `0 18 1 * *` (1st day of month at 6 PM Taipei time)
- **Purpose**: Send monthly activity overview to users

### 2. Weekly Reminders

- **URL**: `https://your-app.vercel.app/api/reminders?type=weekly`
- **Schedule**: `0 18 * * *` (Daily at 6 PM Taipei time)
- **Purpose**: Send weekly activity reminders

### 3. Daily Reminders

- **URL**: `https://your-app.vercel.app/api/reminders?type=daily`
- **Schedule**: `0 18 * * *` (Daily at 6 PM Taipei time)
- **Purpose**: Send daily activity reminders

### 4. 🆕 Automatic Cleanup

- **URL**: `https://your-app.vercel.app/api/reminders?type=cleanup`
- **Schedule**: `0 8 * * *` (Daily at 8 AM Taipei time - same as your existing cron)
- **Purpose**: Delete activities older than 1 day
- **Authentication**: Requires `CRON_API_KEY`

## Cron Job Setup on cron-job.org

### Step 1: Create Account

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Verify your email

### Step 2: Add Monthly Overview Job

1. Click "Create cronjob"
2. **Title**: "Church Calendar - Monthly Overview"
3. **URL**: `https://your-app.vercel.app/api/reminders?type=monthly`
4. **Schedule**: `0 18 1 * *`
5. **Headers**:
   - Key: `x-api-key`
   - Value: `your-secure-random-api-key-here`
6. **Timezone**: Asia/Taipei
7. Click "Create"

### Step 3: Add Weekly Reminders Job

1. Click "Create cronjob"
2. **Title**: "Church Calendar - Weekly Reminders"
3. **URL**: `https://your-app.vercel.app/api/reminders?type=weekly`
4. **Schedule**: `0 18 * * *`
5. **Headers**:
   - Key: `x-api-key`
   - Value: `your-secure-random-api-key-here`
6. **Timezone**: Asia/Taipei
7. Click "Create"

### Step 4: Add Daily Reminders Job

1. Click "Create cronjob"
2. **Title**: "Church Calendar - Daily Reminders"
3. **URL**: `https://your-app.vercel.app/api/reminders?type=daily`
4. **Schedule**: `0 18 * * *`
5. **Headers**:
   - Key: `x-api-key`
   - Value: `your-secure-random-api-key-here`
6. **Timezone**: Asia/Taipei
7. Click "Create"

### Step 5: Add Cleanup Job

1. Click "Create cronjob"
2. **Title**: "Church Calendar - Cleanup Old Events"
3. **URL**: `https://your-app.vercel.app/api/cleanup`
4. **Schedule**: `0 19 * * *`
5. **Headers**:
   - Key: `x-api-key`
   - Value: `your-secure-random-api-key-here`
6. **Timezone**: Asia/Taipei
7. Click "Create"

## Schedule Explanation

### Time Format

- Format: `minute hour day month day-of-week`
- All times are in Taipei timezone (UTC+8)

### Schedule Breakdown

- `0 18 1 * *` = 6:00 PM on the 1st day of every month
- `0 18 * * *` = 6:00 PM every day
- `0 19 * * *` = 7:00 PM every day

### Why 7 PM for Cleanup?

- Runs after daily reminders (6 PM)
- Gives time for any last-minute activity updates
- Ensures events are deleted after they've passed for a full day

## Testing Cron Jobs

### Manual Testing

You can test each endpoint manually:

```bash
# Test monthly overview
curl -X POST "https://your-app.vercel.app/api/reminders?type=monthly" \
  -H "x-api-key: your-secure-random-api-key-here"

# Test weekly reminders
curl -X POST "https://your-app.vercel.app/api/reminders?type=weekly" \
  -H "x-api-key: your-secure-random-api-key-here"

# Test daily reminders
curl -X POST "https://your-app.vercel.app/api/reminders?type=daily" \
  -H "x-api-key: your-secure-random-api-key-here"

# Test cleanup
curl -X POST "https://your-app.vercel.app/api/reminders?type=cleanup" \
  -H "x-api-key: your-secure-random-api-key-here"
```

### Expected Responses

- **Success**: `{"success": true, "message": "..."}`
- **Error**: `{"error": "...", "message": "..."}`

## Monitoring

### Check Logs

- Monitor Vercel function logs for execution status
- Check cron-job.org dashboard for job history
- Verify database changes after cleanup runs

### Troubleshooting

1. **Authentication Errors**: Verify `CRON_API_KEY` is set correctly
2. **Timeout Errors**: Check if your Vercel function timeout is sufficient
3. **Database Errors**: Verify Supabase connection and permissions
4. **LINE API Errors**: Check LINE channel access token validity

## Security Notes

- Keep your `CRON_API_KEY` secure and random
- Don't commit API keys to version control
- Use different keys for different environments
- Rotate keys periodically for security
