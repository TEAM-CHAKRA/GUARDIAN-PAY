import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError } from './utils/response.js';
import { ERROR_CODES } from './config/constants.js';

export const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing with Credentials
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-user-id'],
  })
);

// Cookie Parser & Strict JSON Body Parser (16kb limit)
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));

// Mount Main API Router at /api and /api/v1
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// 404 Handler for Unmatched Routes
app.use((req, res) => {
  sendError(
    res,
    {
      code: ERROR_CODES.NOT_FOUND,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: {},
    },
    404
  );
});

// Central Error Handler
app.use(errorHandler);
