import { Request, Response, NextFunction } from 'express';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

const MAX_TOKENS = 10;
const REFILL_RATE = 1;

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = {
      tokens: MAX_TOKENS,
      lastRefill: now,
    };
    buckets.set(ip, bucket);
  }

  const secondsPassed = (now - bucket.lastRefill) / 1000;
  const refill = Math.floor(secondsPassed * REFILL_RATE);

  if (refill > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  }

  bucket.tokens -= 1;
  next();
};

export default rateLimiter;
