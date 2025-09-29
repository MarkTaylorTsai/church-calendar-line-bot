# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Purpose: LINE bot to manage church activities and send scheduled reminders.
- Stack: Node.js (ESM), Vercel serverless API routes, Supabase (PostgreSQL), LINE Messaging API.
- Key directories: api (route handlers), services (business logic), lib (integrations/utilities), middleware (auth/validation/errors), models (domain objects), scripts (DB setup/seed).

Commands you’ll commonly use
- Install dependencies
  ```bash path=null start=null
  npm install
  ```
- Development server (requires Vercel CLI; npx works without global install)
  ```bash path=null start=null
  npm run dev
  # or
  npx vercel dev
  ```
- Build (no-op, provided for CI consistency)
  ```bash path=null start=null
  npm run build
  ```
- Lint and fix
  ```bash path=null start=null
  npm run lint
  npm run lint:fix
  ```
- Tests
  ```bash path=null start=null
  npm test
  npm run test:watch
  ```
- Run a single Jest test (by file or by name)
  ```bash path=null start=null
  npx jest path/to/file.test.js
  npx jest -t "name or pattern"
  ```
- Database bootstrap (Supabase schema and sample data via scripts/)
  ```bash path=null start=null
  npm run setup-db
  npm run seed-data
  ```

Environment
- Required (from README and docs/authentication):
  - SUPABASE_URL, SUPABASE_ANON_KEY
  - LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET
  - Optional/Recommended:
    - TIMEZONE (e.g., Asia/Taipei)
    - LINE_USER_ID (comma-separated allowlist for admin actions)
    - CRON_API_KEY (to protect reminder triggers)
- Local dev: put these in .env for vercel dev to load (or configure via Vercel project settings for deployments).

How to exercise endpoints locally (via vercel dev)
- Activities
  ```bash path=null start=null
  # list
  curl "http://localhost:3000/api/activities"
  # create
  curl -X POST "http://localhost:3000/api/activities" \
    -H "Content-Type: application/json" \
    -H "x-line-user-id: U<your-id>" \
    -d '{"name":"主日聚會","date":"2025-10-05"}'
  ```
- Reminders (cron triggers)
  ```bash path=null start=null
  curl -X POST "http://localhost:3000/api/reminders?type=monthly" -H "x-api-key: {{CRON_API_KEY}}"
  curl -X POST "http://localhost:3000/api/reminders?type=weekly" -H "x-api-key: {{CRON_API_KEY}}"
  curl -X POST "http://localhost:3000/api/reminders?type=daily" -H "x-api-key: {{CRON_API_KEY}}"
  ```
- Webhook (LINE platform posts here; requires x-line-signature)
  ```bash path=null start=null
  curl -X POST "http://localhost:3000/api/webhook" \
    -H "Content-Type: application/json" \
    -H "x-line-signature: <computed-signature>" \
    -d '{"events":[]}'
  ```

High-level architecture and flow
- Routes (api/)
  - api/activities.js: CRUD for activities. Uses requireAuth middleware semantics: GET is open; POST/PUT/DELETE require either a valid LINE user (via x-line-user-id or webhook source) or a cron API key if used from automation.
  - api/reminders.js: Dispatches monthly/weekly/daily reminder jobs. Note: currently does not enforce cron API key in code; see “Important notes” below.
  - api/webhook.js: LINE webhook entry. Verifies x-line-signature using lib/line.js, then processes events (message/follow/unfollow) and routes commands to services.
- Services (services/)
  - ActivityService: Orchestrates validation and persistence for activities via lib/database.js.
  - ReminderService: Queries upcoming activities and formats/sends reminder broadcasts through services/LineService.js.
  - LineService (services/LineService.js): Validates inputs and delegates to lib/line.js for HTTP calls to LINE; provides helpers to format and send common messages (lists, details, errors, confirmations).
- Integration layer (lib/)
  - lib/database.js: Supabase client wrapper. Provides filtered queries (by month/year), CRUD, date-range fetches, and ID lookups with consistent error mapping (e.g., “Activity not found”).
  - lib/line.js: Thin LINE API client with axios, HMAC SHA256 signature verification for webhooks, retry/backoff, and basic methods (push, broadcast, profile/group/room summary).
  - lib/utils.js, lib/validators.js: Formatting, date helpers, input validation used across middleware/services/models.
- Middleware (middleware/)
  - auth.js: Two auth paths — LINE user allowlist (LINE_USER_ID) for CRUD, or CRON_API_KEY for automation. Utilities include requireAuth, validateLineUserId, validateCronApiKey, and logAccessAttempt.
  - validation.js: Request shape guards for activities, IDs, reminder type, webhook headers/content type.
  - errorHandler.js: Centralized error translation to JSON with environment-aware stack traces and typed codes (VALIDATION_ERROR, NOT_FOUND, LINE_API_ERROR, DATABASE_ERROR, TIMEOUT).
- Models (models/)
  - Activity: Domain model with formatting (yyyy-mm-dd), day-of-week in Chinese, temporal classification helpers (today/tomorrow/this_week/next_week/this_month), validation, and convenience factories.

Important notes and gotchas
- Cron protection mismatch: docs/authentication specifies CRON_API_KEY is required for reminder endpoints, but api/reminders.js currently does not enforce it. If you need to secure these endpoints, wire validateCronApiKey (from middleware/auth.js) into the reminders route before switching on type.
- ESM: package.json sets "type": "module"; use import/export syntax and .js extensions in relative imports.
- Jest config: No explicit jest.config.* in repo; Jest uses defaults. Place tests under tests/ or name with .test.js/.spec.js for discovery.
- ESLint config: The repo contains both eslint.config.js (flat config) and .eslintrc.js (legacy). The scripts use eslint . which respects the flat config. Prefer updating only one style to avoid confusion in the future.

Key references from repo docs
- README.md: Features, endpoints, required env vars, quick-start, and sample cron schedules.
- docs/authentication.md: Details LINE user allowlist, required headers, and cron API key usage and examples.

Deployment quick ref
- Vercel production deploy
  ```bash path=null start=null
  vercel --prod
  ```
- Cron schedules (per README/design):
  - Monthly overview: 0 18 1 * * → POST /api/reminders?type=monthly (include x-api-key)
  - Weekly reminders: 0 18 * * * → POST /api/reminders?type=weekly (include x-api-key)
  - Daily reminders: 0 18 * * * → POST /api/reminders?type=daily (include x-api-key)
