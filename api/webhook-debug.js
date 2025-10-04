// Simplified webhook handler for debugging
export default async function handler(req, res) {
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Check environment variables first
    const envCheck = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? 'SET' : 'NOT_SET'
    };
    console.log('Environment variables:', envCheck);
    
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST method is supported for webhook'
      });
    }
    
    // Check for missing environment variables
    const missingEnvVars = [];
    if (!process.env.SUPABASE_URL) missingEnvVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_ANON_KEY) missingEnvVars.push('SUPABASE_ANON_KEY');
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) missingEnvVars.push('LINE_CHANNEL_ACCESS_TOKEN');
    if (!process.env.LINE_CHANNEL_SECRET) missingEnvVars.push('LINE_CHANNEL_SECRET');
    
    if (missingEnvVars.length > 0) {
      console.error('Missing environment variables:', missingEnvVars);
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Missing required environment variables',
        missing: missingEnvVars
      });
    }
    
    // Test basic imports
    try {
      console.log('Testing imports...');
      const { LineService } = await import('../services/LineService.js');
      const { ActivityService } = await import('../services/ActivityService.js');
      const { errorHandler } = await import('../middleware/errorHandler.js');
      const { isAuthorizedUser, logAccessAttempt } = await import('../middleware/auth.js');
      console.log('All imports successful');
      
      // Test service initialization
      console.log('Testing service initialization...');
      const lineService = new LineService();
      const activityService = new ActivityService();
      console.log('Services initialized successfully');
      
      // Test database connection
      console.log('Testing database connection...');
      try {
        const activities = await activityService.getActivities();
        console.log('Database connection successful, activities count:', activities ? activities.length : 0);
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to connect to database',
          details: dbError.message
        });
      }
      
      // Test LINE API
      console.log('Testing LINE API...');
      try {
        // Just test the signature verification without making actual API calls
        const signature = req.headers['x-line-signature'];
        if (signature) {
          const isValid = lineService.verifyWebhook(signature, JSON.stringify(req.body));
          console.log('LINE signature verification result:', isValid);
        } else {
          console.log('No LINE signature header present');
        }
      } catch (lineError) {
        console.error('LINE API test failed:', lineError);
        return res.status(500).json({
          error: 'LINE API Error',
          message: 'Failed to test LINE API',
          details: lineError.message
        });
      }
      
      console.log('All tests passed successfully');
      return res.status(200).json({
        success: true,
        message: 'Webhook debug completed successfully',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
      
    } catch (importError) {
      console.error('Import or initialization error:', importError);
      return res.status(500).json({
        error: 'Import/Initialization Error',
        message: 'Failed to import or initialize services',
        details: importError.message,
        stack: importError.stack
      });
    }
    
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== WEBHOOK ERROR END ===');
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
}
