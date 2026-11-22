import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { startDiscordBot } from './bot/startBot.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Request logger for development
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Route registration
app.use('/api', apiRouter);

// Catch-all 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP listener
    app.listen(env.PORT, async () => {
      console.log(`🚀 Server running on port ${env.PORT}`);

      // Start Discord Bot
      await startDiscordBot();
    });
  } catch (error) {
    console.error('Fatal: Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
