# Structure - LINE Bot Reminder App

## Project Directory Structure

```
church-calendar-line-bot/
├── api/                          # Vercel API routes
│   ├── activities.js             # Activity CRUD operations
│   ├── reminders.js              # Reminder scheduling endpoints
│   └── webhook.js                # LINE webhook handler
├── lib/                          # Core business logic
│   ├── database.js               # Supabase database operations
│   ├── line.js                   # LINE API integration
│   ├── utils.js                  # Utility functions
│   └── validators.js             # Input validation
├── config/                       # Configuration files
│   ├── database.js               # Database configuration
│   └── line.js                   # LINE API configuration
├── middleware/                   # Express middleware
│   ├── auth.js                   # Authentication middleware
│   ├── validation.js             # Request validation
│   └── errorHandler.js           # Error handling middleware
├── services/                     # Business logic services
│   ├── ActivityService.js        # Activity management
│   ├── ReminderService.js        # Reminder logic
│   └── LineService.js            # LINE messaging
├── models/                       # Data models
│   ├── Activity.js               # Activity model
│   └── Reminder.js               # Reminder model
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/              # Integration tests
│   │   ├── api/
│   │   └── database/
│   └── fixtures/                 # Test data
├── docs/                         # Documentation
│   ├── api.md                    # API documentation
│   ├── deployment.md             # Deployment guide
│   └── troubleshooting.md        # Troubleshooting guide
├── scripts/                      # Utility scripts
│   ├── setup-db.js               # Database setup
│   ├── seed-data.js              # Sample data
│   └── migrate.js                # Database migrations
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── vercel.json                   # Vercel configuration
├── package.json                  # Dependencies and scripts
├── README.md                     # Project overview
├── requirements.md               # Project requirements
├── design.md                     # System design
├── structure.md                  # This file
└── tasks.md                      # Development tasks
```

## File Descriptions

### API Routes (`/api/`)

#### `activities.js`

```javascript
// Activity CRUD operations
export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      return getActivities(req, res);
    case "POST":
      return createActivity(req, res);
    case "PUT":
      return updateActivity(req, res);
    case "DELETE":
      return deleteActivity(req, res);
  }
}
```

#### `reminders.js`

```javascript
// Reminder scheduling endpoints
export default async function handler(req, res) {
  const { type } = req.query;

  switch (type) {
    case "monthly":
      return sendMonthlyOverview(req, res);
    case "weekly":
      return sendWeeklyReminders(req, res);
    case "daily":
      return sendDailyReminders(req, res);
  }
}
```

#### `webhook.js`

```javascript
// LINE webhook handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Handle LINE webhook events
  return handleLineWebhook(req, res);
}
```

### Core Libraries (`/lib/`)

#### `database.js`

```javascript
// Supabase database operations
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class DatabaseService {
  async getActivities(filters = {}) {}
  async createActivity(data) {}
  async updateActivity(id, data) {}
  async deleteActivity(id) {}
  async getActivitiesByDateRange(startDate, endDate) {}
}
```

#### `line.js`

```javascript
// LINE API integration
import axios from "axios";

export class LineService {
  constructor() {
    this.accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    this.baseURL = "https://api.line.me/v2";
  }

  async sendMessage(userId, message) {}
  async sendBroadcastMessage(message) {}
  async verifyWebhook(signature, body) {}
}
```

#### `utils.js`

```javascript
// Utility functions
export function formatDate(date) {
  // Format date to mm-dd-yyyy format
}

export function getDayOfWeek(date) {
  // Get day of week in Chinese
}

export function formatActivityMessage(activities) {
  // Format activities for display
}

export function validateDate(dateString) {
  // Validate date format
}
```

#### `validators.js`

```javascript
// Input validation
export function validateActivityData(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Activity name is required");
  }

  if (!data.date || !isValidDate(data.date)) {
    errors.push("Valid date is required");
  }

  return errors;
}
```

### Services (`/services/`)

#### `ActivityService.js`

```javascript
// Activity business logic
import { DatabaseService } from "../lib/database.js";
import { validateActivityData } from "../lib/validators.js";

export class ActivityService {
  constructor() {
    this.db = new DatabaseService();
  }

  async createActivity(data) {
    const errors = validateActivityData(data);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return await this.db.createActivity(data);
  }

  async getActivities(filters = {}) {
    return await this.db.getActivities(filters);
  }

  async updateActivity(id, data) {
    const errors = validateActivityData(data);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return await this.db.updateActivity(id, data);
  }

  async deleteActivity(id) {
    return await this.db.deleteActivity(id);
  }
}
```

#### `ReminderService.js`

```javascript
// Reminder business logic
import { DatabaseService } from "../lib/database.js";
import { LineService } from "../lib/line.js";
import { formatActivityMessage } from "../lib/utils.js";

export class ReminderService {
  constructor() {
    this.db = new DatabaseService();
    this.line = new LineService();
  }

  async sendMonthlyOverview() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const activities = await this.db.getActivities({
      month: currentMonth,
      year: currentYear,
    });

    const message = formatActivityMessage(activities, "monthly");
    return await this.line.sendBroadcastMessage(message);
  }

  async sendWeeklyReminders() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const activities = await this.db.getActivitiesByDateRange(
      sevenDaysFromNow,
      sevenDaysFromNow
    );

    if (activities.length > 0) {
      const message = formatActivityMessage(activities, "weekly");
      return await this.line.sendBroadcastMessage(message);
    }
  }

  async sendDailyReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await this.db.getActivitiesByDateRange(
      tomorrow,
      tomorrow
    );

    if (activities.length > 0) {
      const message = formatActivityMessage(activities, "daily");
      return await this.line.sendBroadcastMessage(message);
    }
  }
}
```

### Models (`/models/`)

#### `Activity.js`

```javascript
// Activity data model
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
      updated_at: this.updated_at,
    };
  }

  formatForDisplay() {
    const date = new Date(this.date);
    const dayOfWeek = this.getDayOfWeek(date);
    return `${this.formatDate(date)} ${dayOfWeek} ${this.name}`;
  }

  formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }

  getDayOfWeek(date) {
    const days = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    return days[date.getDay()];
  }
}
```

### Configuration Files

#### `vercel.json`

```json
{
  "functions": {
    "api/activities.js": {
      "maxDuration": 10
    },
    "api/reminders.js": {
      "maxDuration": 30
    },
    "api/webhook.js": {
      "maxDuration": 10
    }
  },
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "LINE_CHANNEL_ACCESS_TOKEN": "@line_channel_access_token",
    "LINE_CHANNEL_SECRET": "@line_channel_secret"
  }
}
```

#### `package.json`

```json
{
  "name": "church-calendar-line-bot",
  "version": "1.0.0",
  "description": "LINE Bot for church activity reminders",
  "main": "index.js",
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'No build step required'",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.55.0",
    "nodemon": "^3.0.2"
  }
}
```

#### `.env.example`

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Application Configuration
NODE_ENV=production
TIMEZONE=Asia/Taipei
```

### Test Structure (`/tests/`)

#### Unit Tests

```
tests/unit/
├── services/
│   ├── ActivityService.test.js
│   ├── ReminderService.test.js
│   └── LineService.test.js
├── utils/
│   ├── validators.test.js
│   └── utils.test.js
└── models/
    └── Activity.test.js
```

#### Integration Tests

```
tests/integration/
├── api/
│   ├── activities.test.js
│   ├── reminders.test.js
│   └── webhook.test.js
└── database/
    └── database.test.js
```

### Documentation Structure (`/docs/`)

#### `api.md`

- API endpoint documentation
- Request/response examples
- Error codes and messages

#### `deployment.md`

- Vercel deployment guide
- Environment setup
- Cron job configuration

#### `troubleshooting.md`

- Common issues and solutions
- Debugging guide
- Performance optimization tips

## Code Organization Principles

### 1. Separation of Concerns

- **API Layer**: Handle HTTP requests/responses
- **Service Layer**: Business logic and orchestration
- **Data Layer**: Database operations
- **Utility Layer**: Helper functions

### 2. Dependency Injection

- Services receive dependencies through constructor
- Easy to mock for testing
- Loose coupling between components

### 3. Error Handling

- Centralized error handling middleware
- Consistent error response format
- Proper HTTP status codes

### 4. Validation

- Input validation at API boundaries
- Business rule validation in services
- Data integrity checks in models

### 5. Testing Strategy

- Unit tests for business logic
- Integration tests for API endpoints
- Mock external dependencies
- Test data fixtures for consistency
