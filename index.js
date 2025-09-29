// Main entry point for the Church Calendar LINE Bot
// This file serves as the entry point for Vercel deployment

export default function handler(req, res) {
  res.status(200).json({
    message: 'Church Calendar LINE Bot is running!',
    version: '1.0.0',
    endpoints: {
      activities: '/api/activities',
      reminders: '/api/reminders',
      webhook: '/api/webhook',
      test: '/api/test'
    }
  });
}
