// Debug endpoint to check environment variables and headers
export default async function handler(req, res) {
  try {
    // Log all request details
    console.log('Debug Request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body
    });

    // Check environment variables
    const envCheck = {
      CRON_API_KEY: process.env.CRON_API_KEY ? 'SET' : 'NOT_SET',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'SET' : 'NOT_SET'
    };

    // Check API key from different sources
    const apiKeySources = {
      'x-api-key header': req.headers['x-api-key'],
      'api-key header': req.headers['api-key'],
      'authorization header': req.headers['authorization'],
      'query api_key': req.query.api_key,
      'query api-key': req.query['api-key']
    };

    return res.status(200).json({
      success: true,
      message: 'Debug information',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      apiKeySources: apiKeySources,
      receivedHeaders: Object.keys(req.headers),
      receivedQuery: Object.keys(req.query),
      expectedApiKey: process.env.CRON_API_KEY ? process.env.CRON_API_KEY.substring(0, 10) + '...' : 'NOT_SET'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
