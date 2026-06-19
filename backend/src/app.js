import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';

const app = express();

app.set('trust proxy', 1);

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = env.clientUrl.split(',').map((s) => s.trim());
      const isVercelPreview = /\.vercel\.app$/.test(origin);
      if (allowed.includes(origin) || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(mongoSanitize());
app.use(hpp());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

if (!env.isProd) app.use(morgan('dev'));

// Rate limiting on the API surface
app.use('/api', apiLimiter);

// Routes
app.use('/api', routes);

app.get('/', (_req, res) =>
  res.json({ success: true, message: '🚗 Vehicle Rental Marketplace API', docs: '/api/health' }),
);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
