// In-memory token bucket rate limiter
const requests = new Map();

function rateLimiter(limit = 120, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const timestamps = requests.get(ip).filter(time => now - time < windowMs);
    timestamps.push(now);
    requests.set(ip, timestamps);
    
    if (timestamps.length > limit) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again in a moment.'
      });
    }
    
    next();
  };
}

module.exports = rateLimiter;
