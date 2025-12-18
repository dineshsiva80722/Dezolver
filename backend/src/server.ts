import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { socketService } from './services/socketService';

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

// Initialize socket service
socketService.initialize(server);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  // Close Redis connections
  // Close other resources

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  try {
    // Connect to database
    try {
      await connectDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Database connection failed; continuing in development mode', dbError as Error);
      } else {
        throw dbError;
      }
    }

    // Start server
    server.listen(PORT, HOST, () => {
      logger.info(`Server is running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
