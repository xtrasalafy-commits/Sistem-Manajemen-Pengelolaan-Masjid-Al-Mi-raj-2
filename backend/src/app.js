const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const path = require('path');

const config = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// --- Keamanan dasar -------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (curl/postman) & origin yang terdaftar
      if (!origin || config.clientUrls.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Origin tidak diizinkan oleh CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.options('*', cors());
app.use(hpp());

// --- Parser ---------------------------------------------------------------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(compression());

// --- Logging --------------------------------------------------------------
app.use(morgan(config.isProduction ? 'combined' : config.logLevel, { stream: logger.stream }));

// --- Static file untuk uploads (development / self-hosted) ----------------
app.use('/api/files', express.static(path.join(process.cwd(), config.uploadDir), { fallthrough: true }));

// --- Rate limiting global -------------------------------------------------
app.use('/api', apiLimiter);

// --- Health check ---------------------------------------------------------
app.get('/api/health', (_req, res) =>
  res.status(200).json({ status: 'success', message: 'API Masjid Al-Mi\'raj berjalan', timestamp: new Date().toISOString() })
);

// --- Routes ---------------------------------------------------------------
app.use('/api', routes);

// --- 404 & Error handler (harah paling terakhir) -------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
