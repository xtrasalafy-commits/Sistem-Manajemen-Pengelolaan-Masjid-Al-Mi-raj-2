const { createLogger, format, transports } = require('winston');
const config = require('../config/env');

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

const logger = createLogger({
  level: config.logLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
  ],
  exceptionHandlers: [new transports.Console()],
});

// Stream agar bisa dipakai oleh morgan (HTTP access log)
logger.stream = {
  write: (message) => logger.info(message.replace(/\n$/, '')),
};

module.exports = logger;
