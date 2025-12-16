import Redis from 'ioredis';
import { logger } from '../utils/logger';

const parsed = new URL(process.env.REDIS_URL as string);
const baseOptions = {
  host: parsed.hostname,
  port: parseInt(parsed.port || '33545'),
  password: parsed.password || undefined,
  tls: parsed.protocol === 'rediss:' ? {} : undefined,
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false
};

export const redis = new Redis(baseOptions);
export const pubClient = new Redis(baseOptions);
export const subClient = new Redis(baseOptions);

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.ping();
    logger.info('Redis connection verified');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const closeRedisConnections = async (): Promise<void> => {
  try {
    await redis.quit();
    await pubClient.quit();
    await subClient.quit();
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Error closing Redis connections:', error);
  }
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
