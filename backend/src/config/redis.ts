import Redis from 'ioredis';
import { logger } from '../utils/logger';

const isDev = process.env.NODE_ENV === 'development';
const rawUrl = process.env.REDIS_URL || '';
const shouldFallback =
  isDev &&
  (rawUrl === '' ||
    rawUrl.includes('redis.railway.internal') ||
    rawUrl.includes('localhost') ||
    rawUrl.includes('127.0.0.1'));

const fallbackHost = process.env.REDIS_HOST || 'nozomi.proxy.rlwy.net';
const fallbackPort = process.env.REDIS_PORT || '33545';
const fallbackPassword = process.env.REDIS_PASSWORD || 'TCNGeVnyqBqQnPspqPxlOwLqibsCKRPZ';

const fallbackUrl =
  fallbackPassword
    ? `redis://default:${fallbackPassword}@${fallbackHost}:${fallbackPort}`
    : `redis://${fallbackHost}:${fallbackPort}`;

export const redisUrl = shouldFallback ? fallbackUrl : rawUrl;

const maskedRedisUrl = (redisUrl || '').replace(/:[^:@]+@/, ':****@');
logger.info('Redis connecting to:', {
  url: maskedRedisUrl,
  isDev,
  shouldFallback
});

if (!redisUrl) {
  throw new Error('CRITICAL: REDIS_URL environment variable must be defined for Redis connections');
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false
});
export const pubClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false
});
export const subClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false
});

redis.on('connect', () => {
  logger.info('Redis [main] connected');
});
redis.on('ready', () => {
  logger.info('Redis [main] ready');
});
redis.on('error', (error) => {
  logger.error('Redis [main] error', error);
});
redis.on('close', () => {
  logger.warn('Redis [main] closed');
});
redis.on('reconnecting', (delay: number) => {
  logger.warn('Redis [main] reconnecting', { delay });
});

pubClient.on('connect', () => {
  logger.info('Redis [pub] connected');
});
pubClient.on('ready', () => {
  logger.info('Redis [pub] ready');
});
pubClient.on('error', (error) => {
  logger.error('Redis [pub] error', error);
});
pubClient.on('close', () => {
  logger.warn('Redis [pub] closed');
});
pubClient.on('reconnecting', (delay: number) => {
  logger.warn('Redis [pub] reconnecting', { delay });
});

subClient.on('connect', () => {
  logger.info('Redis [sub] connected');
});
subClient.on('ready', () => {
  logger.info('Redis [sub] ready');
});
subClient.on('error', (error) => {
  logger.error('Redis [sub] error', error);
});
subClient.on('close', () => {
  logger.warn('Redis [sub] closed');
});
subClient.on('reconnecting', (delay: number) => {
  logger.warn('Redis [sub] reconnecting', { delay });
});

export const closeRedisConnections = async (): Promise<void> => {
  try {
    await Promise.all([redis.quit(), pubClient.quit(), subClient.quit()]);
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Error closing Redis connections', error);
  }
};

export const createRedisClient = (): Redis => {
  return new Redis(redisUrl as string, {
    maxRetriesPerRequest: null as any,
    enableOfflineQueue: false
  });
};

export const cache = {
  get: async (key: string): Promise<any> => {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  set: async (key: string, value: any, ttl?: number): Promise<void> => {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },

  del: async (key: string): Promise<void> => {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  },

  flush: async (): Promise<void> => {
    try {
      await redis.flushdb();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }
};
