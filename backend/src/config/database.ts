import mongoose from 'mongoose';
import { env } from './env';

export type MongoConnectionState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'uninitialized';

export const getMongoConnectionState = (): MongoConnectionState => {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'uninitialized';
  }
};

export const connectDatabase = async (): Promise<typeof mongoose | null> => {
  if (process.env.NODE_ENV === 'test' && !process.env.MONGODB_URI) {
    console.log('[Database] Skipping real MongoDB connection in test environment');
    return null;
  }

  try {
    mongoose.connection.on('connected', () => {
      console.log(`[Database] MongoDB successfully connected to ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected');
    });

    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== 'production',
    });

    return conn;
  } catch (error) {
    console.error('[Database] Initial MongoDB connection failed:', (error as Error).message);
    if (env.NODE_ENV === 'production') {
      throw error;
    }
    // In development mode, log warning so developer can still run and inspect API/health
    console.warn('[Database] Server running without active MongoDB connection (check MONGODB_URI in .env)');
    return null;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed');
  }
};
