/**
 * Lightweight in-memory rate limiter for sensitive routes (e.g. login, register)
 * Avoids extra third-party dependencies while protecting against brute force.
 */
const rateLimitMap = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxRequests = options.max || 100; // 100 requests per window
  const message =
    options.message || "Too many requests from this IP, please try again later.";

  // Periodic cleanup every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.startTime > windowMs) {
        rateLimitMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry) {
      rateLimitMap.set(ip, {
        count: 1,
        startTime: now,
      });
      return next();
    }

    if (now - entry.startTime > windowMs) {
      // Reset window
      entry.count = 1;
      entry.startTime = now;
      return next();
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

module.exports = rateLimiter;
