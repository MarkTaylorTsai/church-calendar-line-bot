// Ultra-simple test endpoint
export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Hello from Church Calendar Bot!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
