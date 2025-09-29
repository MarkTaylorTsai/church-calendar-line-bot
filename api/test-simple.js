// Simple test endpoint without dependencies
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST method is supported'
      });
    }

    const { type } = req.query;
    
    // Simple test responses without database or LINE API calls
    switch (type) {
      case 'monthly':
        return res.status(200).json({
          success: true,
          message: 'Monthly overview test successful',
          type: 'monthly',
          timestamp: new Date().toISOString(),
          data: {
            activitiesCount: 0,
            message: 'Test monthly overview message'
          }
        });
        
      case 'weekly':
        return res.status(200).json({
          success: true,
          message: 'Weekly reminders test successful',
          type: 'weekly',
          timestamp: new Date().toISOString(),
          data: {
            activitiesCount: 0,
            message: 'Test weekly reminders message'
          }
        });
        
      case 'daily':
        return res.status(200).json({
          success: true,
          message: 'Daily reminders test successful',
          type: 'daily',
          timestamp: new Date().toISOString(),
          data: {
            activitiesCount: 0,
            message: 'Test daily reminders message'
          }
        });
        
      default:
        return res.status(400).json({
          error: 'Invalid reminder type',
          message: 'Type must be one of: monthly, weekly, daily',
          code: 'INVALID_REMINDER_TYPE'
        });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
