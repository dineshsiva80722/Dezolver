import Redis from 'ioredis';
import { logger } from '../utils/logger';

if (!process.env.REDIS_URL) {
  throw new Error('CRITICAL: REDIS_URL environment variable must be defined for Redis connections');
}

export const redis = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false
});
export const pubClient = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false
});
export const subClient = new Redis(process.env.REDIS_URL as string, {
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

export const connectRedis = async (): Promise<void> => {
  try {
    await Promise.all([redis.ping(), pubClient.ping(), subClient.ping()]);
    logger.info('Redis clients health check passed');
  } catch (error) {
    logger.error('Redis clients health check failed', error);
    throw error;
  }
};

export const closeRedisConnections = async (): Promise<void> => {
  try {
    await Promise.all([redis.quit(), pubClient.quit(), subClient.quit()]);
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Error closing Redis connections', error);
  }
};

export const createRedisClient = (): Redis => {
  return new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null as any,
    enableOfflineQueue: false
  });
};

export const createBullRedisClient = (type: string, label?: string): Redis => {
  const client = new Redis(process.env.REDIS_URL as string, {
    enableReadyCheck: false
  });
  const id = `bull:${label || 'queue'}:${type}`;
  client.on('connect', () => {
    logger.info(`Redis [${id}] connected`);
  });
  client.on('ready', () => {
    logger.info(`Redis [${id}] ready`);
  });
  client.on('error', (error) => {
    logger.error(`Redis [${id}] error`, error);
  });
  client.on('close', () => {
    logger.warn(`Redis [${id}] closed`);
  });
  client.on('reconnecting', (delay: number) => {
    logger.warn(`Redis [${id}] reconnecting`, { delay });
  });
  return client;
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
