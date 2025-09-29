// Test API key endpoint
export default async function handler(req, res) {
  try {
    const expectedKey = process.env.CRON_API_KEY;
    const receivedKey = req.query.api_key;
    
    return res.status(200).json({
      success: true,
      message: 'API Key Test',
      expected: expectedKey ? expectedKey.substring(0, 10) + '...' : 'NOT_SET',
      received: receivedKey ? receivedKey.substring(0, 10) + '...' : 'NOT_RECEIVED',
      match: expectedKey === receivedKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
